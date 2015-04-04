# telerik-extensions-aspnet-grid
Extensions for the Telerik UI for ASP.NET AJAX RadGrid control (and sometimes Kendo UI Grid, which is a descendant of the RadGrid).

Includes a robust RadGrid Group State Preservation extension written in TypeScript that enables you to preserve group expand/collapse states entirely on the client.  Here's an implementation  example (TypeScript):

    var Grid_GroupStatePreservation: ClApps_Common.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Core;
    function ApplicationLoaded(args): void {
    	Sys.Application.remove_load(appLoadedHandler);
    	var GroupStatePreservation_Options = new ClApps_Common.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Options(
    		"RadGrid1", true, "Random Number Sum");
    	GroupStatePreservation_Options.saveGridScrollPosition = true;
    	GroupStatePreservation_Options.ajaxRefresh_AddEventHandlers = true;
    	Grid_GroupStatePreservation = new ClApps_Common.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Core(
    		GroupStatePreservation_Options);
    }
    var appLoadedHandler = (args) => ApplicationLoaded(args);
    Sys.Application.add_load(appLoadedHandler);
    
    //Note: the following $(document).ready(...) method does not ensure that all ASP.Net controls are loaded (Sys.Application.load event is required only for ASP.Net AJAX).
    //	Kendo UI can use this method, however; just call ApplicationLoaded() after you've initialized your Kendo UI grid.
    //$telerik.$(document).ready(function () {
    //	ApplicationLoaded();
    //});
    
    //** If you wanted to control when group states are saved/restored, this is one way to do it:
    function RadAjaxManager1_requestStart(sender, eventArgs): void {
    	//Grid_GroupStatePreservation.SaveGrouping();
    }
    function RadAjaxManager1_responseEnd(sender, eventArgs): void {
    	//Grid_GroupStatePreservation.RestoreGrouping();
    }

View the Wiki for complete documentation.  If you'd like to contribute to this project, please let me know.
