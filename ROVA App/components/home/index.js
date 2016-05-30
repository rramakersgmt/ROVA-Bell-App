'use strict';

app.home = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

// START_CUSTOM_CODE_home
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_home
(function(parent) {
    var appLocalData = JSON.parse(localStorage["app_data"]),
        url=appLocalData[0].server,

        wegingenDataSourceOptions = {
            transport: {
                read: {
                    url: url + "wegingen",
                    type: "get",
                    data: {sid: appLocalData[0].sid, usr: appLocalData[0].login},
                    dataType: "json",
                    cache: false,
                },
                update: {
                    url: url + "wegingupdate",
                    type: "get",
                    data: {sid: appLocalData[0].sid, usr: appLocalData[0].login},
                    dataType: "json",
                },
            },
            change: function (e) {
				$(".km-badge")[0].innerHTML=this.data().length;
            },
            requestEnd: function (e) {
                if (e.type != "read") {
                    // refresh the grid
                    e.sender.read();
                }
            },
            // describe the result format
            schema: {
                model: {
                    id: "hiddenkey",
                    fields: {
                        hiddenkey: 		{type: "number", hidden: true},
                        bonnr: 			{type: "string"},
                        postcode: 		{type: "string"},
                        datum:			{type: "string"},
                        afval:   		{type: "number", hidden: true},
                        afval_type: 	{type: "string"},
                        afval_omschr: 	{type: "string"},
                        afval_prijs:	{type: "number"},
                        quotum:     	{type: "number"},
                        inweging:   	{type: "number"},
                        straat:     	{type: "string"},
                        plaats:     	{type: "string"},
                        gemeente:   	{type: "string"},
                    },
                },
            },
        },
        afvalDataSourceOptions = {
            transport: {
                read: {
                    url: url + "afval2",
                    data: {sid: appLocalData[0].sid, usr: appLocalData[0].login},
                    type: "get",
                    dataType: "json",
                    cache: false,
                 },
            },
            // describe the result format
            schema: {
                model: {
                    id: "afval_id",
                    fields: {
                        afval_id:		{type: "number"},
                        afval_code:		{type: "string"},
                        afval_omschr: 	{type: "string"},
                        prijs:			{type: "number"},
                    },
                },

            },
            change: function (e) {
                
           		homeModel.set("afvalcodes", this.view());
                
            }
        }, 

        afvalDataSource = new kendo.data.DataSource(afvalDataSourceOptions),
        wegingDataSource = new kendo.data.DataSource(wegingenDataSourceOptions),
        homeModel = kendo.observable({

            scanBack: function (e) {
                homeModel.scan(false, false);
            },

            scanBackFlip: function () {
                homeModel.scan(false, true);
            },

            scanFront: function () {
                homeModel.scan(true, false);
            },

            scanFrontFlip: function () {
                homeModel.scan(true, true);
            },

            scan: function (preferFrontCamera, showFlipCameraButton) {
                if (!homeModel.checkSimulator()) {
                    cordova.plugins.barcodeScanner.scan(

                        // success callback function
                        function (result) {
                            // wrapping in a timeout so the dialog doesn't free the app
                            setTimeout(function() {

                                var view = kendo.data.Query.process(wegingDataSource.data()).data,
                                    uid = -1,
                                    afval_type="";

                                for (var x = 0; x < view.length; x++) {
                                    if (view[x].hiddenkey == result.text) {
                                        uid = view[x].uid;
                                        afval_type = view[x].afval_type;
                                        break;
                                    }
                                }

                                /*alert("We got a barcode\n" +
                                      "Result: " + result.text + "\n" +
                                      "Format: " + result.format + "\n" +
                                      "Cancelled: " + result.cancelled + "\n" +
                                      "uid: " + uid);*/
                                
                                if (uid === -1) {
                                    return;
                                }
                                var afvalDataSource = homeModel.get('afvalDataSource');

                                afvalDataSource.read({afval_type: afval_type});
                                homeModel.set('afvalDataSource', afvalDataSource)

                                app.mobileApp.navigate('#components/home/edit.html?uid=' + uid);
                            }, 0);
                        },

                        // error callback function
                        function (error) {
                            alert("Scanning failed: " + error);
                        },

                        // options objects
                        {
                            "preferFrontCamera" : preferFrontCamera, // default false
                            "showFlipCameraButton" : showFlipCameraButton // default false
                        }
                    );
                }
            },
            
            checkSimulator: function() {
                if (window.navigator.simulator === true) {
                    alert('This plugin is not available in the simulator.');
                    return true;
                } else if (window.cordova === undefined) {
                    alert('Plugin not found. Maybe you are running in AppBuilder Companion app which currently does not support this plugin.');
                    return true;
                } else {
                    return false;
                }
            },
            
            afvalcodes: [],
            wegingDataSource: wegingDataSource,
            afvalDataSource: afvalDataSource,

            searchChange: function(e) {
                setTimeout(function() {
                    var searchVal = e.target.value,
                        searchFilter,
                        model = parent.get('homeModel'),
                        wegingDataSource = model.get('wegingDataSource');

                    if (searchVal) {
                        searchFilter = {
                            field: 'bonnr',
                            operator: 'contains',
                            value: searchVal
                        };
                        wegingDataSource.filter(searchFilter);
                    } else {
                        wegingDataSource.filter({});
                        $("#search").blur();
                    }
                    
		            $("#scroller").data("kendoMobileScroller").animatedScrollTo(0, 0);

                }, 100);
            },
            itemClick: function(e) {
                var afvalDataSource = homeModel.get('afvalDataSource');
                
                afvalDataSource.read({afval_type: e.dataItem.afval_type});
				this.set('afvalDataSource', afvalDataSource)
                
                app.mobileApp.navigate('#components/home/edit.html?uid=' + e.dataItem.uid);
            },
            detailsShow: function(e) {
                var item = e.view.params.uid,
                    wegingDataSource = homeModel.get('wegingDataSource'),
                    itemModel = wegingDataSource.getByUid(item);

                if (!itemModel.bonnr) {
                    itemModel.bonnr = String.fromCharCode(160);
                }

                homeModel.set('currentItem', null);
                homeModel.set('currentItem', itemModel);
            },
            currentItem: null
        });

    parent.set('editItemViewModel', kendo.observable({
        onShow: function(e) {
            var itemUid = e.view.params.uid,
                wegingDataSource = homeModel.get('wegingDataSource'),
                itemData = wegingDataSource.getByUid(itemUid);

            this.set('itemData', itemData);
        },
        onSaveClick: function(e) {
            var 
                itemData = this.get('itemData'),
                wegingDataSourcee = homeModel.get('wegingDataSource');

            wegingDataSource.one('sync', function(e) {
                app.mobileApp.navigate('#:back');
            });

            wegingDataSource.one('error', function() {
                wegingDataSource.cancelChanges(itemData);
            });

            wegingDataSource.sync();
        },

    }));

    parent.set('homeModel', homeModel);

    parent.set('onShow', function(e) {

    });
})(app.home);

// START_CUSTOM_CODE_homeModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_homeModel