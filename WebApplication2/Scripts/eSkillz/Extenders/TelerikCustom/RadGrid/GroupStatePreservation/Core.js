/// <reference path="../../gridcommon/groupstatepreservation/core.ts" />
var eSkillz;
(function (eSkillz) {
    var Extenders;
    (function (Extenders) {
        var TelerikCustom;
        (function (TelerikCustom) {
            var RadGrid;
            (function (RadGrid) {
                var GroupStatePreservation;
                (function (GroupStatePreservation) {
                    (function (RefreshModes) {
                        RefreshModes[RefreshModes["ClientDataSource"] = 1] = "ClientDataSource";
                        RefreshModes[RefreshModes["AJAX"] = 2] = "AJAX";
                    })(GroupStatePreservation.RefreshModes || (GroupStatePreservation.RefreshModes = {}));
                    var RefreshModes = GroupStatePreservation.RefreshModes;
                    var Options = (function () {
                        function Options(gridClientID, RefreshMode, addEventHandlers, saveGridScrollPosition, gridContainerSelector) {
                            if (RefreshMode === void 0) { RefreshMode = null; }
                            if (addEventHandlers === void 0) { addEventHandlers = true; }
                            if (saveGridScrollPosition === void 0) { saveGridScrollPosition = false; }
                            if (gridContainerSelector === void 0) { gridContainerSelector = null; }
                            this.gridClientID = gridClientID;
                            this.RefreshMode = RefreshMode;
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
                            this._gridCurrentPageIndex = 0;
                            this._restoreInProgress_GridView = null;
                            this._Initialize();
                        }
                        Core.prototype.get_Options = function () {
                            return this._Options;
                        };
                        Core.prototype._Initialize = function () {
                            var _this = this;
                            if (!this._Options.RefreshMode) {
                                if (console && typeof console.log === "function") {
                                    console.log("Error, must specify Options.RefreshMode.");
                                }
                                return;
                            }
                            this._commonGroupState = new eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Core(new eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Options("tr.rgGroupHeader", "td button", ":last", "td", ":last", "rgExpand", "rgCollapse", function ($groupHeaderElement) { return _this.GetGroupDataByRow($groupHeaderElement); }));
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
                        Core.prototype.GetGroupDataByRow = function ($groupHeaderElement) {
                            var dataSpan = $groupHeaderElement.find("span[data-gdata]"), groupData;
                            if (dataSpan.length === 0) {
                                if (console && typeof console.log === "function") {
                                    console.log("Error, group data attribute [data-gdata] is missing.");
                                }
                                return null;
                            }
                            groupData = JSON.parse(dataSpan.attr("data-gdata"));
                            return {
                                key: groupData.groupLevel.toString() + groupData.fieldName + groupData.fieldValue,
                                level: groupData.groupLevel,
                                fieldName: groupData.fieldName
                            };
                        };
                        Core.prototype.ToggleGroupByRow = function ($groupHeaderElement, toggleAction) {
                            //TODO: This code does not seem to work...check with Telerik
                            //var view = this.get_GridMasterTableView();
                            //switch (toggleAction) {
                            //	case eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.Expand:
                            //		view.expandGroup($groupHeaderElement.get(0));
                            //		break;
                            //	case eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.Collapse:
                            //		view.collapseGroup($groupHeaderElement.get(0));
                            //		break;
                            //}
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
                            grid.add_dataBinding(function (sender, args) { return _this._Grid_OnDataBinding(sender, args); });
                            grid.add_dataBound(function (sender, args) { return _this._Grid_OnDataBound(sender, args); });
                        };
                        Core.prototype._Grid_OnDataBinding = function (sender, args) {
                            this.FinishSaveGroupingCheck();
                        };
                        Core.prototype._Grid_OnDataBound = function (sender, args) {
                            this.RestoreGrouping();
                        };
                        //#endregion
                        Core.prototype.get_Grid = function () {
                            return ($find(this._Options.gridClientID));
                        };
                        Core.prototype.get_GridMasterTableView = function (grid) {
                            if (this._restoreInProgress_GridView) {
                                return this._restoreInProgress_GridView;
                            }
                            else {
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
                                    var masterTableView = this.get_GridMasterTableView();
                                    if (masterTableView) {
                                        this._gridCurrentPageIndex = masterTableView.get_currentPageIndex();
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
                                    $containerElement = this.get_$GridDataElement();
                                }
                                if ($containerElement && $containerElement.length === 1) {
                                    var masterTableView = this.get_GridMasterTableView();
                                    if (masterTableView && this._gridCurrentPageIndex === masterTableView.get_currentPageIndex()) {
                                        $containerElement.get(0).scrollTop = this._containerScrollTop;
                                    }
                                    else {
                                        $containerElement.get(0).scrollTop = 0;
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
                        Core.prototype.FinishSaveGroupingCheck = function (forceSave) {
                            if (forceSave === void 0) { forceSave = false; }
                            this._scrollPosition_Save();
                            this._commonGroupState.FinishSaveGroupingCheck(this._get_$MasterTableViewElement(), forceSave);
                        };
                        Core.prototype.RestoreGrouping = function (defaultGroupToggleAction) {
                            var _this = this;
                            if (defaultGroupToggleAction === void 0) { defaultGroupToggleAction = 0 /* None */; }
                            this._restoreInProgress_GridView = this.get_GridMasterTableView();
                            this._commonGroupState.RestoreGrouping(this._get_$MasterTableViewElement(), defaultGroupToggleAction);
                            setTimeout(function () { return _this._scrollPosition_Restore(); }, 0);
                            this._restoreInProgress_GridView = null;
                        };
                        Core.prototype.ResetGrouping = function () {
                            this._commonGroupState.ResetGrouping();
                            this._containerScrollTop = 0;
                        };
                        return Core;
                    })();
                    GroupStatePreservation.Core = Core;
                })(GroupStatePreservation = RadGrid.GroupStatePreservation || (RadGrid.GroupStatePreservation = {}));
            })(RadGrid = TelerikCustom.RadGrid || (TelerikCustom.RadGrid = {}));
        })(TelerikCustom = Extenders.TelerikCustom || (Extenders.TelerikCustom = {}));
    })(Extenders = eSkillz.Extenders || (eSkillz.Extenders = {}));
})(eSkillz || (eSkillz = {}));
//# sourceMappingURL=Core.js.map