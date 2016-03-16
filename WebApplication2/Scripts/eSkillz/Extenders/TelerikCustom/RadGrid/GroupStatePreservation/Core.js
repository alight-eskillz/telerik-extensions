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
                        function Core(options) {
                            this.options = options;
                            this._restoreInProgress_GridView = null;
                            this._Initialize();
                        }
                        Core.prototype.get_Options = function () {
                            return this.options;
                        };
                        Core.prototype._Initialize = function () {
                            var _this = this;
                            if (!this.options.RefreshMode) {
                                if (console && typeof console.log === "function") {
                                    console.log("Error, must specify Options.RefreshMode.");
                                }
                                return;
                            }
                            this._commonGroupState =
                                new eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Core(new eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Options("tr.rgGroupHeader", "td button", ":last", "td", ":last", "rgExpand", "rgCollapse", function ($groupHeaderElement) { return _this.GetGroupDataByRow($groupHeaderElement); }));
                            this._addGroupStateChangeEventHandlers();
                            this._InitializeStateTrackingMode();
                        };
                        Core.prototype.GetGroupDataByRow = function ($groupHeaderElement) {
                            switch (this.options.RefreshMode) {
                                case RefreshModes.ClientDataSource:
                                    var grid = this.get_Grid(), masterTableView = (grid.get_masterTableView()), kendoDataSourceWidget = $find(grid._clientDataSourceID).get_kendoWidget();
                                    var groupLevel = $groupHeaderElement.children(".rgGroupCol").length, groups = kendoDataSourceWidget.group(), fieldName = groups[groupLevel - 1].field;
                                    var nextDataRow = $groupHeaderElement.nextUntil("tr.rgRow,tr.rgAltRow").last().next();
                                    nextDataRow = (nextDataRow.length === 1 ? nextDataRow : $groupHeaderElement.next());
                                    var dataItems = masterTableView.get_dataItems();
                                    var fieldValue, nextDataRowElement = nextDataRow.get(0);
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
                                    var groupData = JSON.parse(groupDataString);
                                    if (!groupData || typeof groupData.FieldValue === "undefined") {
                                        return null;
                                    }
                                    return {
                                        key: groupData.GroupLevel.toString() + groupData.FieldName + groupData.FieldValue,
                                        level: groupData.GroupLevel,
                                        fieldName: groupData.FieldName
                                    };
                            }
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
                            this.gridGroupStateChangedHandler = function (sender, args) {
                                if (_this._commonGroupState.get_pauseGroupStateChangeEventHandlers()) {
                                    return;
                                }
                                _this.SaveGroupStateAsync();
                            };
                            grid.add_groupExpanded(this.gridGroupStateChangedHandler);
                            grid.add_groupCollapsed(this.gridGroupStateChangedHandler);
                        };
                        Core.prototype._removeGroupStateChangeEventHandlers = function () {
                            var grid = this.get_Grid();
                            grid.remove_groupExpanded(this.gridGroupStateChangedHandler);
                            grid.remove_groupCollapsed(this.gridGroupStateChangedHandler);
                        };
                        //#endregion
                        Core.prototype._InitializeStateTrackingMode = function () {
                            var _this = this;
                            switch (this.options.RefreshMode) {
                                case RefreshModes.ClientDataSource:
                                    var grid = this.get_Grid();
                                    grid.add_dataBinding(function (sender, args) { _this.SaveGroupStateFinishCheck(); });
                                    grid.add_dataBound(function (sender, args) { _this.RestoreGroupState(); });
                                    break;
                                case RefreshModes.AJAX:
                                    var prmInstance = Sys.WebForms.PageRequestManager.getInstance();
                                    if (!prmInstance) {
                                        if (console && typeof console.log === "function") {
                                            console.log("Error, Options.RefreshMode was set to AJAX, but there is no PageRequestManager.");
                                        }
                                        return;
                                    }
                                    prmInstance.add_beginRequest(function (sender, args) {
                                        _this._removeGroupStateChangeEventHandlers();
                                        _this.SaveGroupStateFinishCheck();
                                    });
                                    prmInstance.add_endRequest(function (sender, args) {
                                        _this.RestoreGroupState();
                                        _this._addGroupStateChangeEventHandlers();
                                    });
                                    break;
                            }
                        };
                        Core.prototype.get_Grid = function () {
                            return ($find(this.options.gridClientID));
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
                            var gridDataElement = $("#" + this.options.gridClientID + "_GridData");
                            if (gridDataElement.length === 1) {
                                return gridDataElement;
                            }
                            return null;
                        };
                        Core.prototype._scrollPosition_Save = function () {
                            if (this.get_Options().saveGridScrollPosition) {
                                var $containerElement;
                                if (this.options.gridContainerSelector) {
                                    $containerElement = $(this.options.gridContainerSelector);
                                }
                                else {
                                    $containerElement = this.get_$GridDataElement();
                                }
                                var masterTableView = this.get_GridMasterTableView();
                                if (masterTableView) {
                                    this._commonGroupState.SaveScrollPosition($containerElement, masterTableView.get_currentPageIndex());
                                }
                            }
                        };
                        Core.prototype._scrollPosition_Restore = function () {
                            if (this.get_Options().saveGridScrollPosition) {
                                var $containerElement;
                                if (this.options.gridContainerSelector) {
                                    $containerElement = $(this.options.gridContainerSelector);
                                }
                                else {
                                    $containerElement = this.get_$GridDataElement();
                                }
                                var masterTableView = this.get_GridMasterTableView();
                                if (masterTableView) {
                                    this._commonGroupState.RestoreScrollPosition($containerElement, masterTableView.get_currentPageIndex());
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
                        Core.prototype.SaveGroupStateAsync = function () {
                            this._scrollPosition_Save();
                            this._commonGroupState.SaveGroupStateAsync(this._get_$MasterTableViewElement());
                        };
                        Core.prototype.SaveGroupStateFinishCheck = function (forceSave) {
                            if (forceSave === void 0) { forceSave = false; }
                            this._scrollPosition_Save();
                            this._commonGroupState.SaveGroupStateFinishCheck(this._get_$MasterTableViewElement(), forceSave);
                        };
                        Core.prototype.RestoreGroupState = function (defaultGroupToggleAction) {
                            var _this = this;
                            if (defaultGroupToggleAction === void 0) { defaultGroupToggleAction = eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.None; }
                            this._restoreInProgress_GridView = this.get_GridMasterTableView();
                            this._commonGroupState.RestoreGroupState(this._get_$MasterTableViewElement(), defaultGroupToggleAction);
                            setTimeout(function () { return _this._scrollPosition_Restore(); }, 0);
                            this._restoreInProgress_GridView = null;
                        };
                        Core.prototype.ResetGroupState = function () {
                            this._commonGroupState.ResetGroupState();
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