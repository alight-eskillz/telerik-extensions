<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="RadGrid_ClientDataSourceWebForm.aspx.cs" Inherits="WebApplication2.RadGrid_ClientDataSourceWebForm" %>

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

            <telerik:RadGrid ID="RadGrid1" runat="server" AllowFilteringByColumn="true" AllowSorting="true" AllowPaging="true" AutoGenerateColumns="false"
                ClientDataSourceID="RadClientDataSource1" PageSize="20" RenderMode="Lightweight" ShowGroupPanel="true">
                <GroupingSettings GroupByFieldsSeparator=" | " ShowUnGroupButton="true" />
                <ClientSettings AllowDragToGroup="true" AllowExpandCollapse="true">
                    <Scrolling AllowScroll="true" UseStaticHeaders="true" ScrollHeight="400" />
                    <ClientEvents OnUserAction="$.noop" />
                </ClientSettings>
                <MasterTableView GroupLoadMode="Client" GroupsDefaultExpanded="false" CommandItemDisplay="Top" ClientDataKeyNames="ID">
                    <GroupByExpressions>
                        <telerik:GridGroupByExpression>
                            <SelectFields>
                                <telerik:GridGroupByField FieldAlias="Name" FieldName="Name"></telerik:GridGroupByField>
                            </SelectFields>
                            <GroupByFields>
                                <telerik:GridGroupByField FieldName="Name"></telerik:GridGroupByField>
                            </GroupByFields>
                        </telerik:GridGroupByExpression>
                        <telerik:GridGroupByExpression>
                            <SelectFields>
                                <telerik:GridGroupByField FieldAlias="Publisher" FieldName="Publisher"></telerik:GridGroupByField>
                            </SelectFields>
                            <GroupByFields>
                                <telerik:GridGroupByField FieldName="Publisher"></telerik:GridGroupByField>
                            </GroupByFields>
                        </telerik:GridGroupByExpression>
                    </GroupByExpressions>
                    <Columns>
                        <telerik:GridBoundColumn UniqueName="ID" DataField="ID" HeaderText="ID" ReadOnly="true" />
                        <telerik:GridBoundColumn UniqueName="Name" DataField="Name" HeaderText="Name" />
                        <telerik:GridBoundColumn UniqueName="Publisher" DataField="Publisher" HeaderText="Publisher" />
                        <telerik:GridTemplateColumn UniqueName="Category" HeaderText="Category">
                            <ClientItemTemplate>
									<span>#=Category #</span>
                            </ClientItemTemplate>
                            <EditItemTemplate>
                                <telerik:RadDropDownList runat="server" ID="CategoryIDDropDown">
                                    <Items>
                                        <telerik:DropDownListItem Text="Category1" Value="Category1" />
                                        <telerik:DropDownListItem Text="Category2" Value="Category2" />
                                        <telerik:DropDownListItem Text="Category3" Value="Category3" />
                                        <telerik:DropDownListItem Text="Category4" Value="Category4" />
                                    </Items>
                                </telerik:RadDropDownList>
                            </EditItemTemplate>
                        </telerik:GridTemplateColumn>
                        <telerik:GridBoundColumn UniqueName="Price" DataField="Price" HeaderText="Price" />
                        <telerik:GridClientDeleteColumn HeaderText="Delete" ButtonType="ImageButton" HeaderStyle-Width="70px">
                        </telerik:GridClientDeleteColumn>
                    </Columns>
                </MasterTableView>
            </telerik:RadGrid>
            <telerik:RadClientDataSource runat="server" ID="RadClientDataSource1">
                <DataSource>
                    <WebServiceDataSourceSettings BaseUrl="api/">
                        <Select Url="products" RequestType="Get" />
                        <Insert Url="products" RequestType="Post" />
                        <Update Url="products" RequestType="Put" />
                        <Delete Url="products" RequestType="Delete" />
                    </WebServiceDataSourceSettings>
                </DataSource>
                <Schema>
                    <Model ID="ID">
                        <telerik:ClientDataSourceModelField FieldName="ID" DataType="Number" />
                        <telerik:ClientDataSourceModelField FieldName="Name" DataType="String" />
                        <telerik:ClientDataSourceModelField FieldName="Category" DataType="String" />
                        <telerik:ClientDataSourceModelField FieldName="Price" DataType="Number" />
                    </Model>
                </Schema>
            </telerik:RadClientDataSource>
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
                    var groupStatePreservationOptions =
                        new eSkillz.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Options(
                            "<%= this.RadGrid1.ClientID%>",
							//Change the following option to StateTrackingModes.ClientDataSource for client data sources
							eSkillz.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.RefreshModes.ClientDataSource,
							true);
                    groupStatePreservationOptions.SaveGridScrollPosition = true;
                    GridGroupStatePreservation = new eSkillz.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Core(
                        groupStatePreservationOptions);
                }

                var appLoadedHandler = function (args) {
                    return ApplicationLoaded(args);
                };

                Sys.Application.add_load(appLoadedHandler);
            </script>
        </telerik:RadCodeBlock>
    </form>
</body>
</html>
