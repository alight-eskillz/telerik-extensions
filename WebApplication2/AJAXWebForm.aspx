<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="AjaxWebForm.aspx.cs" Inherits="WebApplication2.AjaxWebForm" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
	<head runat="server">
		<title></title>
	</head>
	<body>
		<form id="form1" runat="server">
			<div>
				<telerik:RadScriptManager runat="server" ID="RadScriptManager1">
					<Scripts>
						<asp:ScriptReference Assembly="Telerik.Web.UI" Name="Telerik.Web.UI.Common.Core.js" />
						<asp:ScriptReference Assembly="Telerik.Web.UI" Name="Telerik.Web.UI.Common.jQuery.js" />
						<asp:ScriptReference Assembly="Telerik.Web.UI" Name="Telerik.Web.UI.Common.jQueryInclude.js" />
					</Scripts>
				</telerik:RadScriptManager>
				<telerik:RadAjaxLoadingPanel runat="server" ID="RadAjaxLoadingPanel1" Skin="Default"></telerik:RadAjaxLoadingPanel>
				<telerik:RadAjaxManager runat="server" ID="RadAjaxManager1" DefaultLoadingPanelID="RadAjaxLoadingPanel1">
					<ClientEvents OnRequestStart="RadAjaxManager1_requestStart" OnResponseEnd="RadAjaxManager1_responseEnd" />
					<AjaxSettings>
						<telerik:AjaxSetting AjaxControlID="Button1">
							<UpdatedControls>
								<telerik:AjaxUpdatedControl ControlID="RadGrid1" />
								<telerik:AjaxUpdatedControl ControlID="Button1" />
							</UpdatedControls>
						</telerik:AjaxSetting>
						<telerik:AjaxSetting AjaxControlID="RadGrid1">
							<UpdatedControls>
								<telerik:AjaxUpdatedControl ControlID="RadGrid1" />
							</UpdatedControls>
						</telerik:AjaxSetting>
					</AjaxSettings>
				</telerik:RadAjaxManager>

				<p>Click to see the expand / collapse state is persisted after post-back</p>
				<asp:Button Text="Ajax request" runat="server" ID="Button1" OnClick="Button1_Click" />
				<br />
				<telerik:RadGrid runat="server" ID="RadGrid1" ShowGroupPanel="true" AutoGenerateColumns="false" 
								 OnNeedDataSource="RadGrid1_NeedDataSource" OnPreRender="RadGrid1_PreRender" AllowPaging="true" PageSize="100"
								 RenderMode="Lightweight">
					<ClientSettings AllowDragToGroup="true">
						<Scrolling AllowScroll="true" UseStaticHeaders="true" ScrollHeight="400" />
					</ClientSettings>

					<GroupingSettings GroupByFieldsSeparator=" | " />
					<MasterTableView GroupLoadMode="Client" GroupsDefaultExpanded="false">
						<Columns>
							<telerik:GridBoundColumn UniqueName="Name" DataField="Name" HeaderText="Name" />
							<telerik:GridBoundColumn UniqueName="Test" DataField="Test" HeaderText="Test" />
							<telerik:GridBoundColumn UniqueName="Loc" DataField="Loc" HeaderText="Loc" />
							<telerik:GridBoundColumn UniqueName="Desc" DataField="Desc" HeaderText="Desc" />
							<telerik:GridBoundColumn UniqueName="RandNum" DataField="RandNum" HeaderText="Random #" />
						</Columns>
						<GroupByExpressions>
							<telerik:GridGroupByExpression>
								<GroupByFields>
									<telerik:GridGroupByField FieldName="Name" FieldAlias="Name" />
								</GroupByFields>
								<SelectFields>
									<telerik:GridGroupByField FieldName="Name" FieldAlias="Name" />
									<telerik:GridGroupByField FieldName="RandNum" FieldAlias="RandNum" HeaderText="Random Number Sum" Aggregate="Sum" />
								</SelectFields>
							</telerik:GridGroupByExpression>
							<telerik:GridGroupByExpression>
								<GroupByFields>
									<telerik:GridGroupByField FieldName="Test" FieldAlias="Test" />
								</GroupByFields>
								<SelectFields>
									<telerik:GridGroupByField FieldName="Test" FieldAlias="Test" />
									<telerik:GridGroupByField FieldName="RandNum" FieldAlias="RandNum" HeaderText="Random Number Sum" Aggregate="Sum" />
								</SelectFields>
							</telerik:GridGroupByExpression>
						</GroupByExpressions>
					</MasterTableView>
				</telerik:RadGrid>
			</div>
			<div>
				<p>Note that group state is also preserved when changing pages (very handy when groups continue to the next page).</p>
				<p>It doesn't seem possible to track the page change event client-side (at least not with AJAX), so it's important to set the RadGrid as an AjaxSetting with itself as an updated control. See the wiki for more details.</p>
			</div>

			<%--NOTE: Typically, you may want to combine all TypeScript into a single file (which can be configured in Project Settings).
			In that case, include only the combined JS file here.
			These JS files have been kept separate only for demonstration purposes.--%>

			<script type="text/javascript" src="/Scripts/eSkillz/Extenders/TelerikCustom/GridCommon/GroupStatePreservation/Core.js"></script>
			<script type="text/javascript" src="/Scripts/eSkillz/Extenders/TelerikCustom/RadGrid/GroupStatePreservation/Core.js"></script>
			<telerik:RadCodeBlock ID="cbInit" runat="server">
				<script type="text/javascript">
					var GridGroupStatePreservation;

					function ApplicationLoaded(args) {
						Sys.Application.remove_load(appLoadedHandler);
						var GroupStatePreservationOptions =
							new eSkillz.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Options(
								"<%= this.RadGrid1.ClientID%>",
								//Change the following option to StateTrackingModes.ClientDataSource for client data sources
								eSkillz.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.RefreshModes.AJAX,
								true);
						GroupStatePreservationOptions.saveGridScrollPosition = true;
						GridGroupStatePreservation = new eSkillz.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Core(
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
					    //GridGroupStatePreservation.SaveGroupState();
					}
					function RadAjaxManager1_responseEnd(sender, eventArgs) {
					    //GridGroupStatePreservation.RestoreGroupState();
					}
				</script>
			</telerik:RadCodeBlock>
		</form>
	</body>
</html>
