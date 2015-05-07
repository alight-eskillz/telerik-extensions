/// <reference path="../../../../../typings/telerik/kendo.all.d.ts" />
/// <reference path="../../gridcommon/groupstatepreservation/core.ts" />
var eSkillz;
(function (eSkillz) {
    var Extenders;
    (function (Extenders) {
        var TelerikCustom;
        (function (TelerikCustom) {
            var KendoGrid;
            (function (KendoGrid) {
                var GroupStatePreservation;
                (function (GroupStatePreservation) {
                    var Options = (function () {
                        function Options(gridClientID, groupByExpressionAggregates_AutoStrip, groupByExpressionAggregates_SecondDisplayName, addEventHandlers, saveGridScrollPosition, gridContainerSelector) {
                            if (groupByExpressionAggregates_AutoStrip === void 0) { groupByExpressionAggregates_AutoStrip = false; }
                            if (groupByExpressionAggregates_SecondDisplayName === void 0) { groupByExpressionAggregates_SecondDisplayName = null; }
                            if (addEventHandlers === void 0) { addEventHandlers = true; }
                            if (saveGridScrollPosition === void 0) { saveGridScrollPosition = false; }
                            if (gridContainerSelector === void 0) { gridContainerSelector = null; }
                            this.gridClientID = gridClientID;
                            this.groupByExpressionAggregates_AutoStrip = groupByExpressionAggregates_AutoStrip;
                            this.groupByExpressionAggregates_SecondDisplayName = groupByExpressionAggregates_SecondDisplayName;
                            this.addEventHandlers = addEventHandlers;
                            this.saveGridScrollPosition = saveGridScrollPosition;
                            this.gridContainerSelector = gridContainerSelector;
                        }
                        return Options;
                    })();
                    GroupStatePreservation.Options = Options;
                    var Core = (function () {
                        function Core(_Options) {
                            this._Options = _Options;
                            this._containerScrollTop = 0;
                            this._gridCurrentPageNumber = 1;
                            this._Initialize();
                        }
                        Core.prototype.get_Options = function () {
                            return this._Options;
                        };
                        Core.prototype._Initialize = function () {
                            var grid = this.get_Grid();
                            var gridInternalProperties = grid;
                            var GroupingSettings_GroupByFieldsSeparator = ";";
                            if (gridInternalProperties._groupingSettings) {
                                GroupingSettings_GroupByFieldsSeparator = gridInternalProperties._groupingSettings.GroupByFieldsSeparator;
                            }
                            this._commonGroupState = new eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Core(new eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Options("tr.k-grouping-row", "td a", ":last", "td", ":last", "k-i-expand", "k-i-collapse", GroupingSettings_GroupByFieldsSeparator, this._Options));
                            this._InitializeStateTrackingModes_ClientSideData();
                        };
                        //#region Client Data Source Event Handlers
                        Core.prototype._InitializeStateTrackingModes_ClientSideData = function () {
                            var _this = this;
                            var grid = this.get_Grid();
                            grid.bind("dataBinding", function (sender, args) { return _this._Grid_OnDataBinding(sender, args); });
                            grid.bind("dataBound", function (sender, args) { return _this._Grid_OnDataBound(sender, args); });
                            //NOTE: The Kendo Grid does not have any Group Expand/Collapse events to which we can bind, so this is our only option right now.
                        };
                        Core.prototype._Grid_OnDataBinding = function (sender, args) {
                            //NOTE: forceSave is set to true here because the Kendo UI grid does not have any built-in events for group expand/collapse (so the method can't run asynchronously).
                            //		Contacted Telerik to request such events.
                            //		Until then, adding custom event handlers (add click handlers to the expand/ collapse buttons on init and on grid data bound, remove handlers on data binding to prevent memory leak) might be the only option.
                            //			It would be very easy to add those events by getting all toggle elements via _commonGroupingState._get_$groupToggleElementsAll (would need to make that method public; probably make both Toggle and Text element retrieval functions public).
                            this.FinishSaveGroupingCheck(true);
                        };
                        Core.prototype._Grid_OnDataBound = function (sender, args) {
                            this.RestoreGrouping();
                        };
                        //#endregion
                        Core.prototype.get_Grid = function () {
                            return ($("#" + this._Options.gridClientID).data("kendoGrid"));
                        };
                        //#region Scroll Position
                        Core.prototype.get_$GridContentElement = function () {
                            //Note: this element is available only when the grid has static headers and scrolling enabled in the grid
                            var gridDataElement = this.get_Grid().element.find(".k-grid-content");
                            if (gridDataElement.length === 1) {
                                return gridDataElement;
                            }
                            return null;
                        };
                        Core.prototype._scrollPosition_Save = function () {
                            if (this.get_Options().saveGridScrollPosition) {
                                var $containerElement;
                                if (this._Options.gridContainerSelector) {
                                    $containerElement = $(this._Options.gridContainerSelector);
                                }
                                else {
                                    $containerElement = this.get_$GridContentElement();
                                }
                                if ($containerElement && $containerElement.length === 1) {
                                    this._containerScrollTop = $containerElement.get(0).scrollTop;
                                    var page = this.get_Grid().dataSource.page();
                                    if (page) {
                                        this._gridCurrentPageNumber = page;
                                    }
                                }
                                else {
                                    if (console && typeof console.log === "function") {
                                        console.log("Grid Group State Preservation: Scroll container not found.  Enable grid scrolling or specify a container selector in Options.");
                                    }
                                }
                            }
                        };
                        Core.prototype._scrollPosition_Restore = function () {
                            if (this.get_Options().saveGridScrollPosition) {
                                var $containerElement;
                                if (this._Options.gridContainerSelector) {
                                    $containerElement = $(this._Options.gridContainerSelector);
                                }
                                else {
                                    $containerElement = this.get_$GridContentElement();
                                }
                                if ($containerElement && $containerElement.length === 1) {
                                    var page = this.get_Grid().dataSource.page();
                                    if (page && this._gridCurrentPageNumber === page) {
                                        $containerElement.get(0).scrollTop = this._containerScrollTop;
                                    }
                                }
                                else {
                                    if (console && typeof console.log === "function") {
                                        console.log("Grid Group State Preservation: Scroll container not found.  Enable grid scrolling or specify a container selector in Options.");
                                    }
                                }
                            }
                        };
                        //#endregion
                        Core.prototype._get_$GridElement = function () {
                            var gridElement = this.get_Grid().element;
                            if (!gridElement) {
                                return null;
                            }
                            return $(gridElement);
                        };
                        Core.prototype.SaveGroupingAsync = function () {
                            this._scrollPosition_Save();
                            this._commonGroupState.SaveGroupingAsync(this._get_$GridElement());
                        };
                        Core.prototype.FinishSaveGroupingCheck = function (forceSave) {
                            if (forceSave === void 0) { forceSave = false; }
                            this._commonGroupState.FinishSaveGroupingCheck(this._get_$GridElement(), forceSave);
                        };
                        Core.prototype.RestoreGrouping = function () {
                            this._commonGroupState.RestoreGrouping(this._get_$GridElement());
                            this._scrollPosition_Restore();
                        };
                        Core.prototype.ResetGrouping = function () {
                            this._commonGroupState.ResetGrouping();
                            this._containerScrollTop = 0;
                        };
                        return Core;
                    })();
                    GroupStatePreservation.Core = Core;
                })(GroupStatePreservation = KendoGrid.GroupStatePreservation || (KendoGrid.GroupStatePreservation = {}));
            })(KendoGrid = TelerikCustom.KendoGrid || (TelerikCustom.KendoGrid = {}));
        })(TelerikCustom = Extenders.TelerikCustom || (Extenders.TelerikCustom = {}));
    })(Extenders = eSkillz.Extenders || (eSkillz.Extenders = {}));
})(eSkillz || (eSkillz = {}));
//# sourceMappingURL=Core.js.map