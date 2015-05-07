/// <reference path="../../gridcommon/groupstatepreservation/core.ts" />
var eSkillz;
(function (eSkillz) {
    var Extenders;
    (function (Extenders) {
        var TelerikCustom;
        (function (TelerikCustom) {
            var ASPNetGrid;
            (function (ASPNetGrid) {
                var GroupStatePreservation;
                (function (GroupStatePreservation) {
                    (function (RefreshModes) {
                        RefreshModes[RefreshModes["ClientDataSource"] = 1] = "ClientDataSource";
                        RefreshModes[RefreshModes["AJAX"] = 2] = "AJAX";
                    })(GroupStatePreservation.RefreshModes || (GroupStatePreservation.RefreshModes = {}));
                    var RefreshModes = GroupStatePreservation.RefreshModes;
                    var Options = (function () {
                        function Options(gridClientID, RefreshMode, groupByExpressionAggregates_AutoStrip, groupByExpressionAggregates_SecondDisplayName, addEventHandlers, saveGridScrollPosition, gridContainerSelector) {
                            if (RefreshMode === void 0) { RefreshMode = null; }
                            if (groupByExpressionAggregates_AutoStrip === void 0) { groupByExpressionAggregates_AutoStrip = false; }
                            if (groupByExpressionAggregates_SecondDisplayName === void 0) { groupByExpressionAggregates_SecondDisplayName = null; }
                            if (addEventHandlers === void 0) { addEventHandlers = true; }
                            if (saveGridScrollPosition === void 0) { saveGridScrollPosition = false; }
                            if (gridContainerSelector === void 0) { gridContainerSelector = null; }
                            this.gridClientID = gridClientID;
                            this.RefreshMode = RefreshMode;
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
                            this._Initialize();
                        }
                        Core.prototype.get_Options = function () {
                            return this._Options;
                        };
                        Core.prototype._Initialize = function () {
                            if (!this._Options.RefreshMode) {
                                if (console && typeof console.log === "function") {
                                    console.log("Error, must specify Options.RefreshMode.");
                                }
                                return;
                            }
                            var grid = this.get_Grid();
                            var gridInternalProperties = grid;
                            var GroupingSettings_GroupByFieldsSeparator = ";";
                            if (gridInternalProperties._groupingSettings) {
                                GroupingSettings_GroupByFieldsSeparator = gridInternalProperties._groupingSettings.GroupByFieldsSeparator;
                            }
                            this._commonGroupState = new eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Core(new eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Options("tr.rgGroupHeader", "td button", ":last", "td", ":last", "rgExpand", "rgCollapse", GroupingSettings_GroupByFieldsSeparator, this._Options));
                            this._addGroupStateChangeEventHandlers();
                            switch (this._Options.RefreshMode) {
                                case 1 /* ClientDataSource */:
                                    this._InitializeStateTrackingModes_ClientSideData();
                                    break;
                                case 2 /* AJAX */:
                                    this._InitializeStateTrackingModes_Ajax();
                                    break;
                            }
                        };
                        Core.prototype._addGroupStateChangeEventHandlers = function () {
                            var _this = this;
                            var grid = this.get_Grid();
                            this.gridGroupStateChangedHandler = function (sender, args) { return _this._gridGroupStateChanged(sender, args); };
                            grid.add_groupExpanded(this.gridGroupStateChangedHandler);
                            grid.add_groupCollapsed(this.gridGroupStateChangedHandler);
                        };
                        Core.prototype._removeGroupStateChangeEventHandlers = function () {
                            var grid = this.get_Grid();
                            grid.remove_groupExpanded(this.gridGroupStateChangedHandler);
                            grid.remove_groupCollapsed(this.gridGroupStateChangedHandler);
                        };
                        Core.prototype._gridGroupStateChanged = function (sender, args) {
                            if (this._commonGroupState.get_pauseGroupStateChangeEventHandlers()) {
                                return;
                            }
                            this.SaveGroupingAsync();
                        };
                        //#endregion
                        //#region AJAX Refresh Event Handlers
                        Core.prototype._InitializeStateTrackingModes_Ajax = function () {
                            var _this = this;
                            var prmInstance = Sys.WebForms.PageRequestManager.getInstance();
                            if (!prmInstance) {
                                if (console && typeof console.log === "function") {
                                    console.log("Error, Options.RefreshMode was set to AJAX, but there is no PageRequestManager.");
                                }
                                return;
                            }
                            prmInstance.add_beginRequest(function (sender, args) { return _this._PageRequestManager_BeginRequest(sender, args); });
                            prmInstance.add_endRequest(function (sender, args) { return _this._PageRequestManager_EndRequest(sender, args); });
                        };
                        Core.prototype._PageRequestManager_BeginRequest = function (sender, args) {
                            this._removeGroupStateChangeEventHandlers();
                            this.FinishSaveGroupingCheck();
                        };
                        Core.prototype._PageRequestManager_EndRequest = function (sender, args) {
                            this.RestoreGrouping();
                            this._addGroupStateChangeEventHandlers();
                        };
                        //#endregion
                        //#region Client Data Source Event Handlers
                        Core.prototype._InitializeStateTrackingModes_ClientSideData = function () {
                            var _this = this;
                            var grid = this.get_Grid();
                            grid.add_dataBound(function (sender, args) { return _this._Grid_OnDataBound(sender, args); });
                        };
                        Core.prototype._Grid_OnDataBound = function (sender, args) {
                            this.RestoreGrouping();
                        };
                        //#endregion
                        Core.prototype.get_Grid = function () {
                            return ($find(this._Options.gridClientID));
                        };
                        Core.prototype.get_GridMasterTableView = function (grid) {
                            if (!grid) {
                                grid = this.get_Grid();
                            }
                            try {
                                return grid.get_masterTableView();
                            }
                            catch (err) {
                                if (console && typeof console.log === "function") {
                                    console.log("RadGrid Group State Preservation: MasterTableView missing/error.");
                                }
                            }
                        };
                        //#region Scroll Position
                        Core.prototype.get_$GridDataElement = function () {
                            //Note: this element is available only when the grid has static headers and scrolling enabled in the grid
                            var gridDataElement = $("#" + this._Options.gridClientID + "_GridData");
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
                                    $containerElement = this.get_$GridDataElement();
                                }
                                if ($containerElement && $containerElement.length === 1) {
                                    this._containerScrollTop = $containerElement.get(0).scrollTop;
                                }
                                else {
                                    if (console && typeof console.log === "function") {
                                        console.log("RadGrid Group State Preservation: Scroll container not found.  Enable grid scrolling or specify a container selector in Options.");
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
                                    $containerElement = this.get_$GridDataElement();
                                }
                                if ($containerElement && $containerElement.length === 1) {
                                    $containerElement.get(0).scrollTop = this._containerScrollTop;
                                }
                                else {
                                    if (console && typeof console.log === "function") {
                                        console.log("RadGrid Group State Preservation: Scroll container not found.  Enable grid scrolling or specify a container selector in Options.");
                                    }
                                }
                            }
                        };
                        //#endregion
                        Core.prototype._get_$MasterTableViewElement = function () {
                            var masterTableView = this.get_GridMasterTableView();
                            if (!masterTableView) {
                                return null;
                            }
                            return $(masterTableView.get_element());
                        };
                        Core.prototype.SaveGroupingAsync = function () {
                            this._scrollPosition_Save();
                            this._commonGroupState.SaveGroupingAsync(this._get_$MasterTableViewElement());
                        };
                        Core.prototype.FinishSaveGroupingCheck = function () {
                            this._commonGroupState.FinishSaveGroupingCheck();
                        };
                        Core.prototype.RestoreGrouping = function () {
                            this._commonGroupState.RestoreGrouping(this._get_$MasterTableViewElement());
                            this._scrollPosition_Restore();
                        };
                        Core.prototype.ResetGrouping = function () {
                            this._commonGroupState.ResetGrouping();
                            this._containerScrollTop = 0;
                        };
                        return Core;
                    })();
                    GroupStatePreservation.Core = Core;
                })(GroupStatePreservation = ASPNetGrid.GroupStatePreservation || (ASPNetGrid.GroupStatePreservation = {}));
            })(ASPNetGrid = TelerikCustom.ASPNetGrid || (TelerikCustom.ASPNetGrid = {}));
        })(TelerikCustom = Extenders.TelerikCustom || (Extenders.TelerikCustom = {}));
    })(Extenders = eSkillz.Extenders || (eSkillz.Extenders = {}));
})(eSkillz || (eSkillz = {}));
//# sourceMappingURL=Core.js.map