# telerik-extensions-aspnet-grid
Extensions for the Telerik UI for ASP.NET AJAX RadGrid control.

Includes a robust RadGrid Group State Preservation extension written in TypeScript that enables you to preserve group expand/collapse states entirely on the client.  Here's an implementation  example (TypeScript):

    var Grid_GroupStatePreservation: ClApps_Common.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Core;
    function ApplicationLoaded(): void {
    	var GroupStatePreservation_Options = new ClApps_Common.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Options(
    		"RadGrid1", true, "Random Number Sum");
    	GroupStatePreservation_Options.saveGridScrollPosition = true;
    	Grid_GroupStatePreservation = new ClApps_Common.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Core(
    		GroupStatePreservation_Options);
    }
    $telerik.$(document).ready(function () {
    	ApplicationLoaded();
    });
    
    function RadAjaxManager1_requestStart(sender, eventArgs): void {
    	Grid_GroupStatePreservation.SaveGrouping();
    }
    function RadAjaxManager1_responseEnd(sender, eventArgs): void {
    	Grid_GroupStatePreservation.RestoreGrouping();
    }

View the Wiki for complete documentation.
