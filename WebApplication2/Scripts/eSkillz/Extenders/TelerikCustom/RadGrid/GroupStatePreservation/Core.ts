/// <reference path="../../gridcommon/groupstatepreservation/core.ts" />

module eSkillz.Extenders.TelerikCustom.RadGrid.GroupStatePreservation {
	export enum RefreshModes {
		ClientDataSource = 1,
		AJAX = 2
	}
	export class Options extends GridCommon.GroupStatePreservation.GridOptionsCommon {
		constructor(
			gridClientId: string,
			public RefreshMode: RefreshModes = null,
			addEventHandlers: boolean = true,
			saveGridScrollPosition: boolean = false,
			gridContainerSelector: string = null) {
			super(gridClientId,
				addEventHandlers,
				saveGridScrollPosition,
				gridContainerSelector);
		}
	}
	export class Core {

		constructor(private options: Options) {
			this._Initialize();
		}
		get_Options() {
			return this.options;
		}

		static GroupingSettings_GroupByFieldsSeparator: string;
		private groupStateCommon: GridCommon.GroupStatePreservation.Core;
		private _Initialize() {
			if (!this.options.RefreshMode) {
				if (console && typeof console.log === "function") {
					console.log("Error, must specify Options.RefreshMode.");
				}
				return;
			}

			this.groupStateCommon =
				new GridCommon.GroupStatePreservation.Core(
					new GridCommon.GroupStatePreservation.Setup(
						this.options,
						() => {
							return this._get_$MasterTableViewElement();
						},
						"tr.rgGroupHeader",
						"td button",
						":last",
						"td",
						":last",
						"rgExpand",
						"rgCollapse",
						($groupHeaderElement) => {
							switch (this.options.RefreshMode) {
								case RefreshModes.ClientDataSource:
									var grid = this.get_Grid(),
										masterTableView = <Telerik.Web.UI.GridTableViewInternal>(grid.get_masterTableView()),
										kendoDataSourceWidget = (<Telerik.Web.UI.RadClientDataSource_Corrected>$find(
											(<Telerik.Web.UI.RadGridInternal>grid)._clientDataSourceID)).get_kendoWidget();

									var groupLevel = $groupHeaderElement.children(".rgGroupCol").length,
										groups = kendoDataSourceWidget.group(),
										fieldName = groups[groupLevel - 1].field;

									var nextDataRow = $groupHeaderElement.nextUntil("tr.rgRow,tr.rgAltRow").last().next();
									nextDataRow = (nextDataRow.length === 1 ? nextDataRow : $groupHeaderElement.next());

									var dataItems = masterTableView.get_dataItems();
									var fieldValue: any, nextDataRowElement = nextDataRow.get(0);
									if (nextDataRow.length === 1) {
										for (var i = 0, itemCount = dataItems.length; i < itemCount; i++) {
											var dataItem = dataItems[i];
											if (dataItem.get_element() === nextDataRowElement) {
												fieldValue = dataItem.get_dataItem()[fieldName];
												break;
											}
										}
									}
									if (typeof fieldValue === "undefined") {
										return null;
									}

									return {
										key: groupLevel.toString() + fieldName + fieldValue,
										level: groupLevel,
										fieldName: fieldName
									};
								case RefreshModes.AJAX:
									var groupDataString = $groupHeaderElement.attr("data-gdata");

									if (!groupDataString || groupDataString === "") {
										if (console && typeof console.log === "function") {
											console.log("Error, group data attribute [data-gdata] is missing.");
										}
										return null;
									}
									var groupData = JSON.parse<WebApplication2.Extenders.TelerikCustom.RadGrid.Helpers.GroupData>(groupDataString);

									if (!groupData || typeof groupData.FieldValue === "undefined") {
										return null;
									}

									return {
										key: groupData.GroupLevel.toString() + groupData.FieldName + groupData.FieldValue,
										level: groupData.GroupLevel,
										fieldName: groupData.FieldName
									};
							}
						},
						() => {
							var $containerElement: JQuery;
							if (this.options.GridContainerSelector) {
								$containerElement = $(this.options.GridContainerSelector);
							} else {
								$containerElement = this.get_$GridDataElement();
							}
							var masterTableView = this.get_GridMasterTableView();
							if (masterTableView) {
								return {
									$ScrollElement: $containerElement,
									PageIndex: masterTableView.get_currentPageIndex()
								};
							}

							return null;
						}/*,
					($groupHeaderElement, toggleAction) => {
						//TODO: This code does not work...check with Telerik to see if it's a bug

						//var view = this.get_GridMasterTableView();
						//switch (toggleAction) {
						//	case GridCommon.GroupStatePreservation.GroupToggleActions.Expand:
						//		view.expandGroup($groupHeaderElement.get(0));
						//		break;
						//	case GridCommon.GroupStatePreservation.GroupToggleActions.Collapse:
						//		view.collapseGroup($groupHeaderElement.get(0));
						//		break;
						//}
					}*/));

			this._AddGroupStateChangeEventHandlers();
			this._InitializeStateTrackingMode();
		}

		//#region Group State Change Event Handlers
		private gridGroupStateChangedHandler: (
			sender: Telerik.Web.UI.RadGrid, args: Telerik.Web.UI.GridGroupCollapsingEventArgs) => void;
		private _AddGroupStateChangeEventHandlers() {
			var grid = this.get_Grid();
			this.gridGroupStateChangedHandler = (sender, args) => {
				if (this.groupStateCommon.get_pauseGroupStateChangeEventHandlers()) { return; }
				this.groupStateCommon.SaveGroupStateAsync();
			};
			grid.add_groupExpanded(this.gridGroupStateChangedHandler);
			grid.add_groupCollapsed(this.gridGroupStateChangedHandler);
		}
		private _RemoveGroupStateChangeEventHandlers() {
			var grid = this.get_Grid();
			grid.remove_groupExpanded(this.gridGroupStateChangedHandler);
			grid.remove_groupCollapsed(this.gridGroupStateChangedHandler);
		}
		//#endregion

		private _InitializeStateTrackingMode(): void {
			switch (this.options.RefreshMode) {
				case RefreshModes.ClientDataSource:
					var grid = this.get_Grid();
					grid.add_dataBinding((sender, args) => {
						this.groupStateCommon.SaveGroupStateFinishCheck();
					});
					grid.add_dataBound((sender, args) => {
						this.groupStateCommon.RestoreGroupState();
					});
					break;
				case RefreshModes.AJAX:
					var prmInstance = Sys.WebForms.PageRequestManager.getInstance();
					if (!prmInstance) {
						if (console && typeof console.log === "function") {
							console.log("Error, Options.RefreshMode was set to AJAX, but there is no PageRequestManager.");
						}
						return;
					}
					prmInstance.add_beginRequest((sender, args) => {
						this._RemoveGroupStateChangeEventHandlers();
						this.groupStateCommon.SaveGroupStateFinishCheck();
					});
					prmInstance.add_endRequest((sender, args) => {
						this.groupStateCommon.RestoreGroupState();
						this._AddGroupStateChangeEventHandlers();
					});
					break;
			}
		}

		get_Grid() {
			return <Telerik.Web.UI.RadGrid_Corrected>($find(this.options.GridClientId));
		}
		get_GridMasterTableView(grid?: Telerik.Web.UI.RadGrid): Telerik.Web.UI.GridTableView {
			if (!grid) {
				grid = this.get_Grid();
			}
			try {
				return grid.get_masterTableView();
			} catch (err) {
				if (console && typeof console.log === "function") {
					console.log("RadGrid Group State Preservation: MasterTableView missing/error.");
				}
			}
		}

		get_$GridDataElement(): JQuery {
			//Note: this element is available only when the grid has static headers and scrolling enabled in the grid
			var gridDataElement = $("#" + this.options.GridClientId + "_GridData");
			if (gridDataElement.length === 1) {
				return gridDataElement;
			}
			return null;
		}

		private _get_$MasterTableViewElement(): JQuery {
			var masterTableView = this.get_GridMasterTableView();
			if (!masterTableView) { return null; }

			return $(masterTableView.get_element());
		}

		ResetGroupState(): void {
			this.groupStateCommon.ResetGroupState();
		}
	}
}