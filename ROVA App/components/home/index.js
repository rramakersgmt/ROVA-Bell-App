'use strict';

app.home = kendo.observable({
    onShow: function() {},
    afterShow: function() {
        var fldSearch = $("input[type='search']")[0];

        if ( fldSearch ) {
	   		fldSearch.id="search";
            fldSearch.oninput= function(e) {
                
                setTimeout(function() {

                    $("#scroller").data("kendoMobileScroller").animatedScrollTo(0, 0);
                }, 100);                
			};
    	}

        var appLocalData = JSON.parse(localStorage["app_data"]);

        if (appLocalData[0].sid === "") {
            app.mobileApp.navigate('components/home/settings.html');       
        } else {
            app.home.homeModel.refresh();
        }
    }
});

// START_CUSTOM_CODE_home
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_home
(function(parent) {
    if (localStorage["app_data"] === undefined) {
        var appData = [
            {
                id: 0, 
                login:"", 
                password: "", 
                server: "",
                sid: ""
            }
        ];
        localStorage["app_data"] = JSON.stringify(appData);
    }

    var appLocalData = JSON.parse(localStorage["app_data"]),
        url=appLocalData[0].server,
        wegingenDataSourceOptions = {
            error: function(e) {
                var wegingDataSource = app.home.homeModel.get("wegingDataSource"),
			    	afvalDataSource = app.home.homeModel.get("afvalDataSource"); 
                
                appLocalData[0].password = "";
                appLocalData[0].sid = "";
                localStorage["app_data"] = JSON.stringify(appLocalData);
                app.home.settingsViewModel.set("fldpassword", "");
                app.home.settingsViewModel.set("isLoggedIn", (appLocalData[0].sid !== ""));
                e.preventDefault();

                alert(e.xhr.status + ":" + e.errorThrown);
                
                wegingDataSource.options.transport.read.data="";
                wegingDataSource.options.transport.read.url="";
                wegingDataSource.options.transport.update.data="";
                wegingDataSource.options.transport.update.url="";
                afvalDataSource.options.transport.read.data="";
                afvalDataSource.options.transport.read.url="";
                wegingDataSource.data([]);

                setTimeout(function() {
    	            app.mobileApp.navigate('components/home/settings.html');       
                }, 1000);
            },
            transport: {
                read: {
                    url: url + "wegingen",
                    type: "get",
                    data: {dis: appLocalData[0].sid, usr: appLocalData[0].login},
                    dataType: "json",
                    cache: false,
                    beforeSend: function(req) {
                    }, 
                },
                update: {
                    url: url + "wegingupdate",
                    type: "get",
                    data: {dis: appLocalData[0].sid, usr: appLocalData[0].login},
                    dataType: "json",
                },
            },
            change: function (e) {
                function checkTime(i) {
                    return (i < 10) ? "0" + i : i;
                }                
                if (e.action !== "itemchange") {
                    var today = new Date(),
                        h = checkTime(today.getHours()),
                        m = checkTime(today.getMinutes());
            
                    $("#title")[0].innerHTML= "Wegingen - " + h + ":" + m;
	            	$(".km-badge")[0].innerHTML=e.items.length;
            	}
            },
            requestEnd: function (e) {
                //alert(e.type);
                //if (e.type !== "read") {
                    // refresh the grid

                //    e.sender.read();
                //}
            },
            // describe the result format
            schema: {
                model: {
                    id: "hiddenkey",
                    fields: {
                        hiddenkey: 	 {type: "number", hidden: true},
                        bonnr: 		 {type: "string"},
                        postcode: 	  {type: "string"},
                        datum:		  {type: "string"},
                        afval:   	   {type: "number", hidden: true},
                        afval_type: 	{type: "string"},
                        afval_omschr:   {type: "string"},
                        special:		{type: "number"},
                        afval_prijs:	{type: "number"},
                        quotum:     	{type: "number"},
                        inweging:   	{type: "number"},
                        straat:     	{type: "string"},
                        plaats:         {type: "string"},
                        gemeente:       {type: "string"},
                        search:         {type: "string"},
                    },
                },
            },
        },
        afvalDataSourceOptions = {
            transport: {
                read: {
                    url: url + "afval",
                    data: {dis: appLocalData[0].sid, usr: appLocalData[0].login},
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
            gotoSearch: function (e) {
                $("#search").focus();
                setTimeout(function() {
	                $("#scroller").data("kendoMobileScroller").scrollTo(0, 0);
                }, 500);
            },
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
                                    if (view[x].hiddenkey === Number(result.text)) {
                                        uid = view[x].uid;
                                        afval_type = view[x].afval_type;
                                        break;
                                    }
                                }
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
                            navigator.notification.alert("Scanning failed: " + error);
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
                    navigator.notification.alert('This plugin is not available in the simulator.');
                    return true;
                } else if (window.cordova === undefined) {
                    navigator.notification.alert('Plugin not found. Maybe you are running in AppBuilder Companion app which currently does not support this plugin.');
                    return true;
                } else {
                    return false;
                }
            },
            
            afvalcodes: [],
            wegingDataSource: wegingDataSource,
            afvalDataSource: afvalDataSource,
            itemClick: function(e) {
                var afvalDataSource = homeModel.get('afvalDataSource');
                
                afvalDataSource.read({afval_type: e.dataItem.afval_type});
				this.set('afvalDataSource', afvalDataSource)
                
                app.mobileApp.navigate('#components/home/edit.html?uid=' + e.dataItem.uid);
            },
            refresh : function(e) {
                var wegingDataSource = app.home.homeModel.get("wegingDataSource");

                wegingDataSource.read();
                $("#scroller").data("kendoMobileScroller").animatedScrollTo(0, 0);
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
            this.set("fldPrijsNieuw", null);
            this.set("PrijsNieuw", false);
        },
        onBackClick: function(e) {
			var itemData = this.get('itemData'),
            	wegingDataSource = homeModel.get('wegingDataSource');

            wegingDataSource.cancelChanges(itemData);
        },
        onSaveClick: function(e) {
			var itemData = this.get('itemData'),
                wegingDataSource = homeModel.get('wegingDataSource');

            wegingDataSource.one('sync', function(e) {
                app.mobileApp.navigate('#:back');
            });

            wegingDataSource.one('error', function() {
                wegingDataSource.cancelChanges(itemData);
            });
            this.set("fldPrijsNieuw", null);
            this.set("PrijsNieuw", false);

            wegingDataSource.sync();
        },
		onChange: function(e) {
            var iiAfval = Number(e.currentTarget.selectedOptions[0].value),
                view = kendo.data.Query.process(afvalDataSource.data()).data;
            this.set("PrijsNieuw", true);
            
            for (var x = 0; x < view.length; x++) {
                if (view[x].afval_id === iiAfval) {
                    this.set("fldPrijsNieuw", view[x].prijs);
                    break;
                }
            }
        },
    }));

    parent.set('settingsViewModel', kendo.observable({
        fldserver:  appLocalData[0].server,
        fldlogin:   appLocalData[0].login,
        fldpassword:appLocalData[0].password,
        login: function(e) {
            var url=this.get("fldserver"),
                logindata= {usr: this.get("fldlogin"), pwd: this.get("fldpassword")},
				wegingDataSource = app.home.homeModel.get("wegingDataSource"),
				afvalDataSource = app.home.homeModel.get("afvalDataSource");

            $.ajax({
                type: "POST",
                url: url + "login",
                dataType: "json",
                timeout: 500,
                data: logindata,
                statusCode: {
                    200:function(data) { 
                        appLocalData[0].sid 	 = data[0].sid;
                        appLocalData[0].server   = url;
                        appLocalData[0].login    = logindata.usr;
                        appLocalData[0].password = logindata.pwd;
                        localStorage["app_data"] = JSON.stringify(appLocalData);
						var transportdata= {dis: appLocalData[0].sid, usr: appLocalData[0].login}
            
						wegingDataSource.options.transport.read.data=transportdata;
                        wegingDataSource.options.transport.read.url=url + "wegingen";
						wegingDataSource.options.transport.update.data=transportdata;
                        wegingDataSource.options.transport.update.url=url + "wegingupdate";
						afvalDataSource.options.transport.read.data=transportdata;
						afvalDataSource.options.transport.read.url=url + "afval";
                    	navigator.notification.alert("Ingelogd");
                        setTimeout(function() {
                            wegingDataSource.read();
	                        app.mobileApp.navigate('#:back');
                        }, 1000);
                    },
                },
                //complete: function(httpObj, textStatus, data){},
                error: function (parsedjson, textStatus, errorThrown) {
                    app.home.editItemViewModel.set("fldpassword", "");
                    appLocalData[0].sid = "";
                    appLocalData[0].password = "";
                    localStorage["app_data"] = JSON.stringify(appLocalData);
    			    var elem = document.getElementById("fldpassword");
    				elem.value = "";
                    
                    navigator.notification.alert(parsedjson.statusText);
                },
                async: false
            });
            this.set("isLoggedIn", (appLocalData[0].sid !== ""));
        },
        logout: function(e) {         
            appLocalData[0].sid = "";
            localStorage["app_data"] = JSON.stringify(appLocalData);
			var wegingDataSource = app.home.homeModel.get("wegingDataSource"),
			    afvalDataSource = app.home.homeModel.get("afvalDataSource");            

            var url=this.get("fldserver"); 
            this.set("fldpassword", "");

            appLocalData[0].password = "";
            appLocalData[0].sid = "";
            localStorage["app_data"] = JSON.stringify(appLocalData);

            wegingDataSource.options.transport.read.data="";
            wegingDataSource.options.transport.read.url="";
			wegingDataSource.options.transport.update.data="";
            wegingDataSource.options.transport.update.url="";
			afvalDataSource.options.transport.read.data="";
			afvalDataSource.options.transport.read.url="";
		    var elem = document.getElementById("fldpassword");
			elem.value = "";
            wegingDataSource.data([]);

            $.ajax({
                type: "GET",
                url: url + "logout",
                statusCode: {
                    404:function() { navigator.notification.alert("Server niet gevonden"); },
                    200:function() { navigator.notification.alert("Uitgelogd");            },
                },
                async: false
            });
            this.set("isLoggedIn", (appLocalData[0].sid !== ""));
        },
        isLoggedIn: function() {
            return (appLocalData[0].sid !== "");
        },
    }));

    parent.set('homeModel', homeModel);
    parent.set('onShow', function(e) {});
})(app.home);

// START_CUSTOM_CODE_homeModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_homeModel