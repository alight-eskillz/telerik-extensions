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
                        function Options(gridClientID, addEventHandlers, saveGridScrollPosition, gridContainerSelector, defaultGroupState) {
                            if (addEventHandlers === void 0) { addEventHandlers = true; }
                            if (saveGridScrollPosition === void 0) { saveGridScrollPosition = false; }
                            if (gridContainerSelector === void 0) { gridContainerSelector = null; }
                            if (defaultGroupState === void 0) { defaultGroupState = eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.None; }
                            this.gridClientID = gridClientID;
                            this.addEventHandlers = addEventHandlers;
                            this.saveGridScrollPosition = saveGridScrollPosition;
                            this.gridContainerSelector = gridContainerSelector;
                            this.defaultGroupState = defaultGroupState;
                        }
                        return Options;
                    })();
                    GroupStatePreservation.Options = Options;
                    var Core = (function () {
                        function Core(_Options) {
                            this._Options = _Options;
                            this._restoreInProgress_Grid = null;
                            this._Initialize();
                        }
                        Core.prototype.get_Options = function () {
                            return this._Options;
                        };
                        Core.prototype._Initialize = function () {
                            var _this = this;
                            this._commonGroupState = new eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Core(new eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Options("tr.k-grouping-row", "td a", ":last", "td", ":last", "k-i-expand", "k-i-collapse", function ($groupHeaderElement) { return _this.GetGroupDataByRow($groupHeaderElement); }, function ($groupHeaderElement, toggleAction) { return _this.ToggleGroupByRow($groupHeaderElement, toggleAction); }));
                            this._Initialize_BindEventHandlers();
                        };
                        Core.prototype.GetGroupDataByRow = function ($groupHeaderElement) {
                            var grid = this.get_Grid(), nextData = $groupHeaderElement.nextUntil("[data-uid]").next(), dataItem = grid.dataItem(nextData.length ? nextData : $groupHeaderElement.next()), groupLevel = $groupHeaderElement.children(".k-group-cell").length, groups = grid.dataSource.group(), fieldName = groups[groupLevel].field, fieldValue = dataItem[fieldName];
                            return {
                                key: groupLevel.toString() + fieldName + fieldValue,
                                level: groupLevel,
                                fieldName: fieldName
                            };
                        };
                        Core.prototype.ToggleGroupByRow = function ($groupHeaderElement, toggleAction) {
                            var grid = this.get_Grid();
                            switch (toggleAction) {
                                case eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.Expand:
                                    grid.expandGroup($groupHeaderElement.get(0));
                                    break;
                                case eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.Collapse:
                                    grid.collapseGroup($groupHeaderElement.get(0));
                                    break;
                            }
                        };
                        //#region Event Handlers
                        Core.prototype._Initialize_BindEventHandlers = function () {
                            var _this = this;
                            var grid = this.get_Grid();
                            grid.bind("dataBinding", function (sender, args) { return _this._Grid_OnDataBinding(sender, args); });
                            grid.bind("dataBound", function (sender, args) { return _this._Grid_OnDataBound(sender, args); });
                            this._gridAddToggleButtonClickHandlers();
                        };
                        Core.prototype._gridAddToggleButtonClickHandlers = function () {
                            var _this = this;
                            var grid = this.get_Grid(), commonOptions = this._commonGroupState.get_Options();
                            grid.table.on("click", commonOptions.get_ExpandAndCollapseToggleElementsSelector(), function (e) { return _this._gridGroupToggleClicked(e); });
                        };
                        Core.prototype._gridGroupToggleClicked = function (event) {
                            if (this._commonGroupState.get_pauseGroupStateChangeEventHandlers()) {
                                return;
                            }
                            this.SaveGroupingAsync();
                        };
                        Core.prototype._Grid_OnDataBinding = function (sender, args) {
                            this.FinishSaveGroupingCheck();
                        };
                        Core.prototype._Grid_OnDataBound = function (sender, args) {
                            this.RestoreGrouping(this._Options.defaultGroupState);
                        };
                        //#endregion
                        Core.prototype.get_Grid = function () {
                            if (this._restoreInProgress_Grid) {
                                return this._restoreInProgress_Grid;
                            }
                            else {
                                return ($("#" + this._Options.gridClientID).data("kendoGrid"));
                            }
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
                                this._commonGroupState.SaveScrollPosition($containerElement, this.get_Grid().dataSource.page());
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
                                this._commonGroupState.RestoreScrollPosition($containerElement, this.get_Grid().dataSource.page());
                            }
                        };
                        //#endregion
                        Core.prototype.SaveGroupingAsync = function () {
                            this._scrollPosition_Save();
                            this._commonGroupState.SaveGroupingAsync(this.get_Grid().table);
                        };
                        Core.prototype.FinishSaveGroupingCheck = function (forceSave) {
                            if (forceSave === void 0) { forceSave = false; }
                            this._commonGroupState.FinishSaveGroupingCheck(this.get_Grid().table, forceSave);
                        };
                        Core.prototype.RestoreGrouping = function (defaultGroupToggleAction) {
                            var _this = this;
                            if (defaultGroupToggleAction === void 0) { defaultGroupToggleAction = eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.None; }
                            this._restoreInProgress_Grid = this.get_Grid();
                            this._commonGroupState.RestoreGrouping(this.get_Grid().table, defaultGroupToggleAction);
                            setTimeout(function () { return _this._scrollPosition_Restore(); }, 0);
                            this._restoreInProgress_Grid = null;
                        };
                        Core.prototype.ResetGrouping = function () {
                            this._commonGroupState.ResetGrouping();
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