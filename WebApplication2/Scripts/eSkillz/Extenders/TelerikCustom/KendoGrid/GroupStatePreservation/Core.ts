/// <reference path="../../../../../typings/telerik/kendo.all.d.ts" />
/// <reference path="../../gridcommon/groupstatepreservation/core.ts" />

module eSkillz.Extenders.TelerikCustom.KendoGrid.GroupStatePreservation {
	export class Options extends GridCommon.GroupStatePreservation.GridOptionsCommon {
		constructor(
			gridClientId: string,
			addEventHandlers: boolean = true,
			saveGridScrollPosition: boolean = false,
			gridContainerSelector: string = null,
			public DefaultGroupState = GridCommon.GroupStatePreservation.GroupToggleActions.None
		) {
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
			this.groupStateCommon =
				new GridCommon.GroupStatePreservation.Core(
					new GridCommon.GroupStatePreservation.Setup(
						this.options,
						() => {
							return this.get_Grid().table;
						},
						"tr.k-grouping-row",
						"td a",
						":last",
						"td",
						":last",
						"k-i-expand",
						"k-i-collapse",
						($groupHeaderElement) => {
							var grid = this.get_Grid(),
								nextDataRow = $groupHeaderElement.nextUntil("[data-uid]").last().next(),
								dataItem = grid.dataItem(nextDataRow.length === 1 ? nextDataRow : $groupHeaderElement.next()),
								groupLevel = $groupHeaderElement.children(".k-group-cell").length,
								groups = grid.dataSource.group(),
								fieldName = groups[groupLevel].field,
								fieldValue = dataItem ? dataItem[fieldName] : null;

							if (typeof fieldValue === "undefined") {
								return null;
							}

							return {
								key: groupLevel.toString() + fieldName + fieldValue,
								level: groupLevel,
								fieldName: fieldName
							};
						},
						() => {
							var $containerElement: JQuery;
							if (this.options.GridContainerSelector) {
								$containerElement = $(this.options.GridContainerSelector);
							} else {
								$containerElement = this.get_$GridContentElement();
							}

							var data: GridCommon.GroupStatePreservation.ISaveScrollPositionData = {
								$ScrollElement: $containerElement,
								PageIndex: this.get_Grid().dataSource.page()
							};
							return data;
						},
						($groupHeaderElement, toggleAction) => {
							var grid = this.get_Grid();
							switch (toggleAction) {
								case GridCommon.GroupStatePreservation.GroupToggleActions.Expand:
									grid.expandGroup($groupHeaderElement.get(0));
									break;
								case GridCommon.GroupStatePreservation.GroupToggleActions.Collapse:
									grid.collapseGroup($groupHeaderElement.get(0));
									break;
							}
						}));

			this._Initialize_BindEventHandlers();
		}

		//#region Event Handlers
		private _Initialize_BindEventHandlers() {
			var grid = this.get_Grid();

			grid.bind("dataBinding", (sender, args) => {
				this.groupStateCommon.SaveGroupStateFinishCheck();
			});
			grid.bind("dataBound", (sender, args) => {
				this.groupStateCommon.RestoreGroupState(this.options.DefaultGroupState);
			});

			this._GridAddToggleButtonClickHandlers();
		}
		private _GridAddToggleButtonClickHandlers() {
			var grid = this.get_Grid(),
				commonOptions = this.groupStateCommon.get_Setup();
			grid.table.on(
				"click",
				commonOptions.get_ExpandAndCollapseToggleElementsSelector(),
				(e) => {
					if (this.groupStateCommon.get_pauseGroupStateChangeEventHandlers()) { return; }
					this.groupStateCommon.SaveGroupStateAsync();
				});
		}
		//#endregion

		get_Grid() {
			return <kendo.ui.Grid>($("#" + this.options.GridClientId).data("kendoGrid"));
		}

		get_$GridContentElement(): JQuery {
			//Note: this element is available only when the grid has static headers and scrolling enabled in the grid
			var gridDataElement = this.get_Grid().element.find(".k-grid-content");
			if (gridDataElement.length === 1) {
				return gridDataElement;
			}
			return null;
		}

		ResetGroupState(): void {
			this.groupStateCommon.ResetGroupState();
		}
	}
}