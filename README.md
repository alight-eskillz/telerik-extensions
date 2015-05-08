# telerik-extensions-grid
Extensions for the Telerik UI for ASP.NET AJAX RadGrid and Kendo UI Grid controls (the Kendo UI Grid is very similar to the RadGrid).

Includes a robust Grid Group State Preservation extension written in TypeScript that enables you to preserve group expand/collapse states entirely on the client, even as data and pages change.

**Kendo UI Grid implementation excerpt**

Please review the wiki for full implementation details.

    <body>
		<div id="grid"></div>
		
		<script type="text/javascript" src="/Scripts/eSkillz/Extenders/TelerikCustom/GridCommon/GroupStatePreservation/Core.js"></script>
		<script type="text/javascript" src="/Scripts/eSkillz/Extenders/TelerikCustom/KendoGrid/GroupStatePreservation/Core.js"></script>
		<script type="text/javascript">
			var GridGroupStatePreservation;
			function ApplicationLoaded() {
				var GroupStatePreservationOptions =
					new eSkillz.Extenders.TelerikCustom.KendoGrid.GroupStatePreservation.Options(
						"grid");
				GroupStatePreservationOptions.saveGridScrollPosition = true;
				//Setting this option will automatically collapse all rows by default (rows are collapsed when first group is applied).
				GroupStatePreservationOptions.defaultGroupState =
					eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.Collapse;
				GridGroupStatePreservation = new eSkillz.Extenders.TelerikCustom.KendoGrid.GroupStatePreservation.Core(
					GroupStatePreservationOptions);
			}
		</script>
		
		<script>
			
			$(document).ready(function () {
				var crudServiceBaseUrl = "",
				dataSource = new kendo.data.DataSource({
				...
				});
		
				$("#grid").kendoGrid({
					dataSource: dataSource,
					...
					groupable: true,
					...
				});
		
				ApplicationLoaded();
			});
		
		</script>
    </body>

**ASP.Net RadGrid implementation excerpt**

    <body>
    	<form id="form1" runat="server">
    		<div>
    			...
    			<telerik:RadAjaxManager runat="server" ID="RadAjaxManager1" DefaultLoadingPanelID="RadAjaxLoadingPanel1">
    				...
    				<AjaxSettings>
    					...
    					<telerik:AjaxSetting AjaxControlID="RadGrid1">
    						<UpdatedControls>
    							<telerik:AjaxUpdatedControl ControlID="RadGrid1" />
    						</UpdatedControls>
    					</telerik:AjaxSetting>
    				</AjaxSettings>
    			</telerik:RadAjaxManager>
    
    			...
    			<telerik:RadGrid runat="server" ID="RadGrid1" ShowGroupPanel="true" AutoGenerateColumns="false" 
    							 OnNeedDataSource="RadGrid1_NeedDataSource" OnPreRender="RadGrid1_PreRender" AllowPaging="true" PageSize="100"
    							 RenderMode="Lightweight">
    				<ClientSettings AllowDragToGroup="true">
    					<Scrolling AllowScroll="true" UseStaticHeaders="true" ScrollHeight="400" />
    				</ClientSettings>
    				...
    				<MasterTableView GroupLoadMode="Client" GroupsDefaultExpanded="false">
    					<Columns>
    						...
    					</Columns>
    					<GroupByExpressions>
    						...
    					</GroupByExpressions>
    				</MasterTableView>
    			</telerik:RadGrid>
    		</div>
    			
    		<script type="text/javascript" src="/Scripts/eSkillz/Extenders/TelerikCustom/GridCommon/GroupStatePreservation/Core.js"></script>
    		<script type="text/javascript" src="/Scripts/eSkillz/Extenders/TelerikCustom/RadGrid/GroupStatePreservation/Core.js"></script>
    		<telerik:RadCodeBlock ID="cbInit" runat="server">
    			<script type="text/javascript">
    				var GridGroupStatePreservation;
    
    				function ApplicationLoaded(args) {
    					Sys.Application.remove_load(appLoadedHandler);
    					var GroupStatePreservationOptions =
    						new eSkillz.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Options(
    							"<%= RadGrid1.ClientID%>",
    							//Change the following option to StateTrackingModes.ClientDataSource for client data sources
    							eSkillz.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.RefreshModes.AJAX,
    							true, "Random Number Sum");
    					GroupStatePreservationOptions.saveGridScrollPosition = true;
    					GridGroupStatePreservation = new eSkillz.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Core(
    						GroupStatePreservationOptions);
    				}
    				var appLoadedHandler = function (args) {
    					return ApplicationLoaded(args);
    				};
    				Sys.Application.add_load(appLoadedHandler);
    			</script>
    		</telerik:RadCodeBlock>
    	</form>
    </body>

View the Wiki for complete documentation.  If you'd like to contribute to this project, please let me know.
