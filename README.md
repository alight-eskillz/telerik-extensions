# telerik-extensions-aspnet-grid
Extensions for the Telerik UI for ASP.NET AJAX RadGrid control (and Kendo UI Grid, which is a descendant of the RadGrid).

Includes a robust RadGrid Group State Preservation extension written in TypeScript that enables you to preserve group expand/collapse states entirely on the client, even as data and pages change.

Here's an implementation  example:

    <script type="text/javascript" src="/Scripts/GroupStatePreservation.js"></script>
    <telerik:RadCodeBlock ID="cbInit" runat="server">
    	<script type="text/javascript">
    		var GridGroupStatePreservation;
    		function ApplicationLoaded(args) {
    			Sys.Application.remove_load(appLoadedHandler);
    			var GroupStatePreservationOptions =
    				new ClApps_Common.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Options(
    					"<%= RadGrid1.ClientID%>",
    					//Change the following option to StateTrackingModes.ClientDataSource for client data sources
    					ClApps_Common.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.RefreshModes.AJAX,
    					true, "Random Number Sum");
    			GroupStatePreservationOptions.saveGridScrollPosition = true;
    			GridGroupStatePreservation = new ClApps_Common.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Core(
    				GroupStatePreservationOptions);
    		}
    		var appLoadedHandler = function (args) {
    			return ApplicationLoaded(args);
    		};
    		Sys.Application.add_load(appLoadedHandler);
    		
    		//Note: the following $(document).ready(...) method does not ensure that all ASP.Net controls are loaded (Sys.Application.load event is required only for ASP.Net AJAX).
    		//	Kendo UI can use this method, however; just call ApplicationLoaded() after you've initialized your Kendo UI grid.
    		//$telerik.$(document).ready(function () {
    		//	ApplicationLoaded();
    		//});    		
    	</script>
    </telerik:RadCodeBlock>

View the Wiki for complete documentation.  If you'd like to contribute to this project, please let me know.
