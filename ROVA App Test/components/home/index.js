'use strict';

app.home = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

// START_CUSTOM_CODE_home
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_home
(function(parent) {


    var dataProvider = app.data.wegingen,
        fetchFilteredData = function(paramFilter, searchFilter) {
            var model = parent.get('homeModel'),
                dataSource = model.get('dataSource');

            if (paramFilter) {
                model.set('paramFilter', paramFilter);
            } else {
                model.set('paramFilter', undefined);
            }

            if (paramFilter && searchFilter) {
                dataSource.filter({
                    logic: 'and',
                    filters: [paramFilter, searchFilter]
                });
            } else if (paramFilter || searchFilter) {
                dataSource.filter(paramFilter || searchFilter);
            } else {
                dataSource.filter({});
            }
        },
        dataSourceOptions = {
            transport: {
                read: {
                    url: "http://clearweigh.gmt.nl/demo/wegingen",
                    type: "get",
                    /*data: {sid: appLocalData[0].sid, usr: appLocalData[0].login},*/
                    dataType: "json",
                    cache: false,
                },
                update: {
                    url: "http://clearweigh.gmt.nl/demo/wegingupdate",
                    type: "get",
                    dataType: "json",
                    /*jsonpCallback: "CallBackWegingUpdate",*/
                },
            },
            requestEnd: function (e) {
                if (e.type != "read") {
                    // refresh the grid
                    e.sender.read({sid: appLocalData[0].sid});
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

        dataSource = new kendo.data.DataSource(dataSourceOptions),
        homeModel = kendo.observable({
            dataSource: dataSource,
            searchChange: function(e) {
                var searchVal = e.target.value,
                    searchFilter;

                if (searchVal) {
                    searchFilter = {
                        field: 'bonnr',
                        operator: 'contains',
                        value: searchVal
                    };
                }
                fetchFilteredData(homeModel.get('paramFilter'), searchFilter);
            },
            itemClick: function(e) {
                app.mobileApp.navigate('#components/home/edit.html?uid=' + e.dataItem.uid);
            },
            detailsShow: function(e) {
                var item = e.view.params.uid,
                    dataSource = homeModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

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
                dataSource = homeModel.get('dataSource'),
                itemData = dataSource.getByUid(itemUid);

            this.set('itemData', itemData);
        },
        onSaveClick: function(e) {
            var editFormData = this.get('editFormData'),
                itemData = this.get('itemData'),
                dataSource = homeModel.get('dataSource');

            // prepare edit
            itemData.set('afval_id', editFormData.dropdownlist);

            dataSource.one('sync', function(e) {
                app.mobileApp.navigate('#:back');
            });

            dataSource.one('error', function() {
                dataSource.cancelChanges(itemData);
            });

            dataSource.sync();
        }
    }));

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('homeModel', homeModel);
        });
    } else {
        parent.set('homeModel', homeModel);
    }

    parent.set('onShow', function(e) {
        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null;

        fetchFilteredData(param);
    });
})(app.home);

// START_CUSTOM_CODE_homeModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_homeModel