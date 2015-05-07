/// <reference path="../../../../../typings/telerik/kendo.all.d.ts" />
/// <reference path="../../gridcommon/groupstatepreservation/core.ts" />

module eSkillz.Extenders.TelerikCustom.KendoGrid.GroupStatePreservation {
	export class Options
		implements eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.IImplementationOptions {
		constructor(
			public gridClientID: string,
			public groupByExpressionAggregates_AutoStrip: boolean = false,
			public groupByExpressionAggregates_SecondDisplayName: string = null,
			public addEventHandlers: boolean = true,
			public saveGridScrollPosition: boolean = false,
			public gridContainerSelector: string = null
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
			var grid = this.get_Grid();

			var gridInternalProperties: TelerikInternalProps.Web.UI.RadGrid = (<any>grid);
			var GroupingSettings_GroupByFieldsSeparator = ";";
			if (gridInternalProperties._groupingSettings) {
				GroupingSettings_GroupByFieldsSeparator = gridInternalProperties._groupingSettings.GroupByFieldsSeparator;
			}

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
					GroupingSettings_GroupByFieldsSeparator,
					this._Options));

			this._InitializeStateTrackingModes_ClientSideData();
		}
		
		//#region Client Data Source Event Handlers
		private _InitializeStateTrackingModes_ClientSideData() {
			var grid = this.get_Grid();
			grid.bind("dataBinding",(sender, args) => this._Grid_OnDataBinding(sender, args));
			grid.bind("dataBound",(sender, args) => this._Grid_OnDataBound(sender, args));

			//NOTE: The Kendo Grid does not have any Group Expand/Collapse events to which we can bind, so this is our only option right now.
		}
		private _Grid_OnDataBinding(sender, args) {
			//NOTE: forceSave is set to true here because the Kendo UI grid does not have any built-in events for group expand/collapse (so the method can't run asynchronously).
			//		Contacted Telerik to request such events.
			//		Until then, adding custom event handlers (add click handlers to the expand/ collapse buttons on init and on grid data bound, remove handlers on data binding to prevent memory leak) might be the only option.
			//			It would be very easy to add those events by getting all toggle elements via _commonGroupingState._get_$groupToggleElementsAll (would need to make that method public; probably make both Toggle and Text element retrieval functions public).
			this.FinishSaveGroupingCheck(true);
		}
		private _Grid_OnDataBound(sender, args) {
			this.RestoreGrouping();
		}
		//#endregion

		get_Grid() {
			return <kendo.ui.Grid>($("#" + this._Options.gridClientID).data("kendoGrid"));
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
		private _containerScrollTop: number = 0;
		private _gridCurrentPageNumber: number = 1;
		private _scrollPosition_Save() {
			if (this.get_Options().saveGridScrollPosition) {
				var $containerElement: JQuery;
				if (this._Options.gridContainerSelector) {
					$containerElement = $(this._Options.gridContainerSelector);
				} else {
					$containerElement = this.get_$GridContentElement();
				}
				if ($containerElement && $containerElement.length === 1) {
					this._containerScrollTop = $containerElement.get(0).scrollTop;

					var page = this.get_Grid().dataSource.page();
					if (page) {
						this._gridCurrentPageNumber = page;
					}
				} else {
					if (console && typeof console.log === "function") {
						console.log("Grid Group State Preservation: Scroll container not found.  Enable grid scrolling or specify a container selector in Options.");
					}
				}
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
				if ($containerElement && $containerElement.length === 1) {
					var page = this.get_Grid().dataSource.page();
					if (page && this._gridCurrentPageNumber === page) {
						$containerElement.get(0).scrollTop = this._containerScrollTop;
					}
				} else {
					if (console && typeof console.log === "function") {
						console.log("Grid Group State Preservation: Scroll container not found.  Enable grid scrolling or specify a container selector in Options.");
					}
				}
			}
		}
		//#endregion

		private _get_$GridElement(): JQuery {
			var gridElement = this.get_Grid().element;
			if (!gridElement) { return null; }

			return $(gridElement);
		}

		SaveGroupingAsync(): void {
			this._scrollPosition_Save();
			this._commonGroupState.SaveGroupingAsync(this._get_$GridElement());
		}
		FinishSaveGroupingCheck(forceSave = false): void {
			this._commonGroupState.FinishSaveGroupingCheck(this._get_$GridElement(), forceSave);
		}
		RestoreGrouping(): void {
			this._commonGroupState.RestoreGrouping(this._get_$GridElement());
			this._scrollPosition_Restore();
		}
		ResetGrouping(): void {
			this._commonGroupState.ResetGrouping();
			this._containerScrollTop = 0;
		}
	}
}