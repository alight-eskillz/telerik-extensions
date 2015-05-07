# telerik-extensions-grid
Extensions for the Telerik UI for ASP.NET AJAX RadGrid and Kendo UI Grid controls (the Kendo UI Grid is very similar to the RadGrid).

Includes a robust Grid Group State Preservation extension written in TypeScript that enables you to preserve group expand/collapse states entirely on the client, even as data and pages change.

Here's an implementation  example (please review the wiki for full implementation details):

    <script type="text/javascript" src="/Scripts/eSkillz/Extenders/TelerikCustom/GridCommon/GroupStatePreservation/Core.js"></script>
    <script type="text/javascript" src="/Scripts/eSkillz/Extenders/TelerikCustom/ASPGrid/GroupStatePreservation/Core.js"></script>
    <telerik:RadCodeBlock ID="cbInit" runat="server">
    	<script type="text/javascript">
    		var GridGroupStatePreservation;
    
    		function ApplicationLoaded(args) {
    			Sys.Application.remove_load(appLoadedHandler);
    			var GroupStatePreservationOptions =
    				new eSkillz.Extenders.TelerikCustom.ASPNetGrid.GroupStatePreservation.Options(
    					"<%= RadGrid1.ClientID%>",
    					//Change the following option to StateTrackingModes.ClientDataSource for client data sources
    					eSkillz.Extenders.TelerikCustom.ASPNetGrid.GroupStatePreservation.RefreshModes.AJAX,
    					true, "Random Number Sum");
    			GroupStatePreservationOptions.saveGridScrollPosition = true;
    			GridGroupStatePreservation = new eSkillz.Extenders.TelerikCustom.ASPNetGrid.GroupStatePreservation.Core(
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
    
    		//** If you wanted to control when group states are saved/restored, this is one way to do it:
    		function RadAjaxManager1_requestStart(sender, eventArgs) {
    			//GridGroupStatePreservation.SaveGrouping();
    		}
    		function RadAjaxManager1_responseEnd(sender, eventArgs) {
    			//GridGroupStatePreservation.RestoreGrouping();
    		}
    	</script>
    </telerik:RadCodeBlock>

View the Wiki for complete documentation.  If you'd like to contribute to this project, please let me know.
