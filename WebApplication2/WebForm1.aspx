﻿<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="WebForm1.aspx.cs" Inherits="WebApplication2.WebForm1" %>

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
				<asp:ScriptReference Path="~/GroupStatePreservation.js" />
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
            </AjaxSettings>
        </telerik:RadAjaxManager>

        <p>Click to see the expand / collapse state is persisted after post-back</p>
        <asp:Button Text="Ajax request" runat="server" ID="Button1" OnClick="Button1_Click" />
        <br />
        <telerik:RadGrid runat="server" ID="RadGrid1" ShowGroupPanel="true" AutoGenerateColumns="false" OnNeedDataSource="RadGrid1_NeedDataSource">
            <ClientSettings AllowDragToGroup="true">
                <Scrolling AllowScroll="true" UseStaticHeaders="true" SaveScrollPosition="true" ScrollHeight="400" />
            </ClientSettings>
            <MasterTableView GroupLoadMode="Client">
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
    </form>
</body>
</html>
