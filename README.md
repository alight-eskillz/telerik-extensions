# telerik-extensions-grid
Extensions for the Telerik UI for ASP.NET AJAX RadGrid and Kendo UI Grid controls (the Kendo UI Grid is very similar to the RadGrid).

Includes a robust Grid Group State Preservation extension written in TypeScript that enables you to preserve group expand/collapse states entirely on the client, even as data and pages change.

**Kendo UI Grid implementation example** Please review the wiki for full implementation details.
This is Telerik's main demo page with the Group State Preservation extension applied (copy to the original demo file here to test it out on your computer: [Telerik Installation Path]\Kendo UI Professional Q1 2015\examples\grid\index.html).

    <body>
    
    	<a class="offline-button" href="../index.html">Back</a>
    
    	<div id="example">
    		<div id="grid"></div>
    
    		<!--NOTE: Typically, you may want to combine all TypeScript into a single file (which can be configured in Project Settings).
    		In that case, include only the combined JS file here.
    		These JS files have been kept separate only for demonstration purposes.-->
    
    		<script type="text/javascript" src="Scripts/eSkillz/Extenders/TelerikCustom/GridCommon/GroupStatePreservation/Core.js"></script>
    		<script type="text/javascript" src="Scripts/eSkillz/Extenders/TelerikCustom/KendoGrid/GroupStatePreservation/Core.js"></script>
    
    		<script type="text/javascript">
    			var GridGroupStatePreservation;
    			function ApplicationLoaded() {
    				var GroupStatePreservationOptions =
    					new eSkillz.Extenders.TelerikCustom.KendoGrid.GroupStatePreservation.Options(
    						"grid");
    				GroupStatePreservationOptions.saveGridScrollPosition = true;
    				GridGroupStatePreservation = new eSkillz.Extenders.TelerikCustom.KendoGrid.GroupStatePreservation.Core(
    					GroupStatePreservationOptions);
    			}
    		</script>
    
    		<script>
    			$(document).ready(function () {
    				$("#grid").kendoGrid({
    					dataSource: {
    						type: "odata",
    						transport: {
    							read: "http://demos.telerik.com/kendo-ui/service/Northwind.svc/Customers"
    						},
    						pageSize: 20
    					},
    					height: 550,
    					groupable: true,
    					sortable: true,
    					pageable: {
    						refresh: true,
    						pageSizes: true,
    						buttonCount: 5
    					},
    					columns: [{
    						field: "ContactName",
    						title: "Contact Name",
    						width: 200
    					}, {
    						field: "ContactTitle",
    						title: "Contact Title"
    					}, {
    						field: "CompanyName",
    						title: "Company Name"
    					}, {
    						field: "Country",
    						width: 150
    					}
    					]
    				});
    
    				ApplicationLoaded();
    			});
    		</script>
    	</div>
    </body>

**ASP.Net RadGrid implementation example**

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
