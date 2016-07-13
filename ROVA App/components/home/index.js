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

        if (appLocalData[0].bestand === "") {
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
    function processData (allText) {
        var dataNew = $.csv.toObjects(allText);
        dataSource.filter({field: "Favoriet", operator:"eq", value: "1" });
        var dataOld=dataSource.view();
          
        for (var x = 0; x < dataNew.length; x++) {
            for (var j = 0; j < dataOld.length; j++) {
                if (dataNew[x].Telefoonnummer === dataOld[j].Telefoonnummer) {
                    dataNew[x].Favoriet = dataOld[j].Favoriet;
                } 
                if (dataNew[x].Favoriet !== "1") {
                    dataNew[x].Favoriet = "0";
                }
            }
            dataNew[x].Search = dataNew[x].Groep + dataNew[x].Telefoonnummer + dataNew[x].Omschrijving;
            console.log(dataNew[x]);
        }
        localStorage["grid_data"] = JSON.stringify(dataNew);
        dataSource.filter([]);
    };

    function setTestData(){
        var testData = [
          {Groep:"Groep 1", Omschrijving: "TEST1", Telefoonnummer: "06-185583481"},
          {Groep:"Groep 3", Omschrijving: "TEST2", Telefoonnummer: "06-185583482"},
          {Groep:"Groep 2", Omschrijving: "TEST3", Telefoonnummer: "06-185583483", Favoriet: "1"},
          {Groep:"Groep 3", Omschrijving: "TEST4", Telefoonnummer: "06-185583484"},
          {Groep:"Groep 1", Omschrijving: "TEST5", Telefoonnummer: "06-185583485"}  
         ];
        localStorage["grid_data"] = JSON.stringify(testData);
    }    
    
    if (localStorage["app_data"] === undefined) {
        var appData = [
            {
                bestand: "",
            }
        ];
        localStorage["app_data"] = JSON.stringify(appData);
    }
//    if (localStorage["grid_data"] === undefined) {
        //setTestData();
    //}
    var appLocalData = JSON.parse(localStorage["app_data"]),
        dataSource = new kendo.data.DataSource({
            transport: {
                read: function(options){
                    var localData = JSON.parse(localStorage["grid_data"]);
                    for (var x = 0; x < localData.length; x++) {
                        // Zoek velden samenvoegen
                        localData[x].Search = localData[x].Groep + localData[x].Telefoonnummer + localData[x].Omschrijving;
                        if (localData[x].Favoriet === undefined) {
                            localData[x].Favoriet = "0";
                        }
                    }
                    options.success(localData);
                },
            },
            schema: {
                model: {
                    id: "Code",
                    fields: {
                        Omschrijving: {type: "string"},
                        Groep:        {type: "string"},
                        Telefoon:     {type: "string"},
                        Favoriet:     {type: "string"},
                        Search:       {type: "string"},
                    }

                },
                
            },
            //group: { field: "Groep" },
            sort: { 
                field: "Favoriet", dir: "desc",
            },
            pageSize: 20
        });

//dataSource.filter({field: "Groep", operator:"eq", value: "Groep 2" });

    parent.set('settingsViewModel', kendo.observable({
        dataSource: dataSource,
        bestand:  appLocalData[0].bestand,
        readFile: function(e) {
console.log($(":file")[0].files[0]);
            var url = $(":file")[0].value,
                appLocalData = JSON.parse(localStorage["app_data"]);
            if (url === "") {
                url = this.get('bestand')
            }
            appLocalData[0].bestand = url;
            this.set('bestand', url);
            localStorage["app_data"] = JSON.stringify(appLocalData);

            $.ajax({
                type: "GET",
                url: url,
                dataType: "text",
                success: function(data) {
                    processData(data);
                	navigator.notification.alert("Gegevens zijn ingelezen");
                    setTimeout(function() {
                        app.mobileApp.navigate('#:back');
                    }, 1000);                    
                }
            });            
        },
    }));
    
    parent.set('homeModel', kendo.observable({
        dataSource: dataSource,
        refresh : function(e) {
            var dataSource = app.home.homeModel.get("dataSource");

            dataSource.read();
            $("#scroller").data("kendoMobileScroller").animatedScrollTo(0, 0);
        },
/*        onSucces : function(e){
            alert("Call Succes");
        },
        onError  : function(e){
            alert("Call Error");
        },*/
        phoneCall: function(e) {
            e.preventDefault();
            window.open("tel:" + e.button[0].text);
        },        
        addFavo: function(e) {
            dataSource.filter({field: "Telefoonnummer", operator:"eq", value: e.button[0].id});
            var data=dataSource.view();
            dataSource.filter([]);
            data[0].Favoriet="1";
            var data=dataSource.view();
            localStorage["grid_data"] = JSON.stringify(data);
            app.home.homeModel.refresh();
        },
        delFavo: function(e) {
            dataSource.filter({field: "Telefoonnummer", operator:"eq", value: e.button[0].id});
            var data=dataSource.view();
            dataSource.filter([]);
            data[0].Favoriet="0";
            var data=dataSource.view();
            localStorage["grid_data"] = JSON.stringify(data);
            app.home.homeModel.refresh();
        },
        itemClick: function(e) {
            alert("itemClick");
            //e.dataItem.uid
            //console.log(e.dataItem);
            //window.open("tel:" + e.dataItem.Telefoon);            
            //window.plugins.CallNumber.callNumber(onSuccess, onError, e.dataItem.Telefoon);
            //alert("Bellen");
            //app.mobileApp.navigate('tel:' +  e.dataItem.Telefoon);
        },
        /*gotoSearch: function (e) {
            $("#search").focus();
            setTimeout(function() {
                $("#scroller").data("kendoMobileScroller").scrollTo(0, 0);
            }, 500);
        },*/
    }));
})(app.home);

// START_CUSTOM_CODE_homeModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_homeModel