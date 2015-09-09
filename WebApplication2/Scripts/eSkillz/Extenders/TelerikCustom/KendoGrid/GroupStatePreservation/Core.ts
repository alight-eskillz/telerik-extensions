/// <reference path="../../../../../typings/telerik/kendo.all.d.ts" />
/// <reference path="../../gridcommon/groupstatepreservation/core.ts" />

module eSkillz.Extenders.TelerikCustom.KendoGrid.GroupStatePreservation {
	export class Options {
		constructor(
			public gridClientID: string,
			public addEventHandlers: boolean = true,
			public saveGridScrollPosition: boolean = false,
			public gridContainerSelector: string = null,
			public defaultGroupState = eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.None
			) {
		}
	}
	export class Core
		implements eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.IImplementation {

		constructor(private _Options: Options) {
			this._Initialize();
		}
		get_Options() {
			return this._Options;
		}

		static GroupingSettings_GroupByFieldsSeparator: string;
		private _commonGroupState: eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Core;
		private _Initialize() {
			this._commonGroupState =
			new eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Core(
				new eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Options(
					"tr.k-grouping-row",
					"td a",
					":last",
					"td",
					":last",
					"k-i-expand",
					"k-i-collapse",
					($groupHeaderElement) => this.GetGroupDataByRow($groupHeaderElement),
					($groupHeaderElement, toggleAction) =>
						this.ToggleGroupByRow($groupHeaderElement, toggleAction)));

			this._Initialize_BindEventHandlers();
		}

		GetGroupDataByRow($groupHeaderElement: JQuery):
			eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.IGroupData {
			var grid = this.get_Grid(),
				nextData = $groupHeaderElement.nextUntil("[data-uid]").next(),
				dataItem = grid.dataItem(nextData.length ? nextData : $groupHeaderElement.next()),
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
		}
		ToggleGroupByRow($groupHeaderElement: JQuery,
			toggleAction: eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions): void {
			var grid = this.get_Grid();
			switch (toggleAction) {
				case eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.Expand:
					grid.expandGroup($groupHeaderElement.get(0));
					break;
				case eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.Collapse:
					grid.collapseGroup($groupHeaderElement.get(0));
					break;
			}
		}
		
		//#region Event Handlers
		private _Initialize_BindEventHandlers() {
			var grid = this.get_Grid();

			grid.bind("dataBinding",(sender, args) => this._Grid_OnDataBinding(sender, args));
			grid.bind("dataBound",(sender, args) => this._Grid_OnDataBound(sender, args));

			this._gridAddToggleButtonClickHandlers();
		}
		private _gridAddToggleButtonClickHandlers() {
			var grid = this.get_Grid(),
				commonOptions = this._commonGroupState.get_Options();
			grid.table.on(
				"click",
				commonOptions.get_ExpandAndCollapseToggleElementsSelector(),
				(e) => this._gridGroupToggleClicked(e));
		}
		private _gridGroupToggleClicked(event: JQueryEventObject) {
			if (this._commonGroupState.get_pauseGroupStateChangeEventHandlers()) { return; }
			this.SaveGroupingAsync();
		}
		private _Grid_OnDataBinding(sender, args) {
			this.FinishSaveGroupingCheck();
		}
		private _Grid_OnDataBound(sender, args) {
			this.RestoreGrouping(this._Options.defaultGroupState);
		}
		//#endregion

		get_Grid() {
			if (this._restoreInProgress_Grid) {
				return this._restoreInProgress_Grid;
			} else {
				return <kendo.ui.Grid>($("#" + this._Options.gridClientID).data("kendoGrid"));
			}
		}
		
		//#region Scroll Position
		get_$GridContentElement(): JQuery {
			//Note: this element is available only when the grid has static headers and scrolling enabled in the grid
			var gridDataElement = this.get_Grid().element.find(".k-grid-content");
			if (gridDataElement.length === 1) {
				return gridDataElement;
			}
			return null;
		}
		private _scrollPosition_Save() {
			if (this.get_Options().saveGridScrollPosition) {
				var $containerElement: JQuery;
				if (this._Options.gridContainerSelector) {
					$containerElement = $(this._Options.gridContainerSelector);
				} else {
					$containerElement = this.get_$GridContentElement();
				}
				this._commonGroupState.SaveScrollPosition(
					$containerElement, this.get_Grid().dataSource.page());
			}
		}
		private _scrollPosition_Restore() {
			if (this.get_Options().saveGridScrollPosition) {
				var $containerElement: JQuery;
				if (this._Options.gridContainerSelector) {
					$containerElement = $(this._Options.gridContainerSelector);
				} else {
					$containerElement = this.get_$GridContentElement();
				}
				this._commonGroupState.RestoreScrollPosition(
					$containerElement, this.get_Grid().dataSource.page());
			}
		}
		//#endregion

		SaveGroupingAsync(): void {
			this._scrollPosition_Save();
			this._commonGroupState.SaveGroupingAsync(this.get_Grid().table);
		}
		FinishSaveGroupingCheck(forceSave = false): void {
			this._commonGroupState.FinishSaveGroupingCheck(this.get_Grid().table, forceSave);
		}
		private _restoreInProgress_Grid: kendo.ui.Grid = null;
		RestoreGrouping(
			defaultGroupToggleAction =
			eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.None): void {
			this._restoreInProgress_Grid = this.get_Grid();
			this._commonGroupState.RestoreGrouping(this.get_Grid().table, defaultGroupToggleAction);
			setTimeout(() => this._scrollPosition_Restore(), 0);
			this._restoreInProgress_Grid = null;
		}
		ResetGrouping(): void {
			this._commonGroupState.ResetGrouping();
		}
	}
}