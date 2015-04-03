/// <reference path="typings/telerik/telerik.web.ui.d.ts" />
/// <reference path="typings/microsoft-ajax/microsoft.ajax.d.ts" />
/// <reference path="typings/jquery/jquery.d.ts" />
var $telerik = Telerik.Web.CommonScripts;
$ = $telerik.$;
var ClApps_Common;
(function (ClApps_Common) {
    var Extenders;
    (function (Extenders) {
        var TelerikCustom;
        (function (TelerikCustom) {
            var RadGrid;
            (function (RadGrid) {
                var GroupStatePreservation;
                (function (GroupStatePreservation) {
                    var Options = (function () {
                        function Options(gridClientID, groupByExpressionAggregates_AutoStrip, groupByExpressionAggregates_SecondDisplayName, clientDataSource_AddEventHandlers, ajaxRefresh_AddEventHandlers) {
                            if (groupByExpressionAggregates_AutoStrip === void 0) { groupByExpressionAggregates_AutoStrip = false; }
                            if (groupByExpressionAggregates_SecondDisplayName === void 0) { groupByExpressionAggregates_SecondDisplayName = null; }
                            if (clientDataSource_AddEventHandlers === void 0) { clientDataSource_AddEventHandlers = false; }
                            if (ajaxRefresh_AddEventHandlers === void 0) { ajaxRefresh_AddEventHandlers = false; }
                            this.gridClientID = gridClientID;
                            this.groupByExpressionAggregates_AutoStrip = groupByExpressionAggregates_AutoStrip;
                            this.groupByExpressionAggregates_SecondDisplayName = groupByExpressionAggregates_SecondDisplayName;
                            this.clientDataSource_AddEventHandlers = clientDataSource_AddEventHandlers;
                            this.ajaxRefresh_AddEventHandlers = ajaxRefresh_AddEventHandlers;
                        }
                        return Options;
                    })();
                    GroupStatePreservation.Options = Options;
                    var GroupState = (function () {
                        function GroupState(GroupText, ParentGroupText, IsExpanded, ExpandCollapseButtonElement) {
                            this.GroupText = GroupText;
                            this.ParentGroupText = ParentGroupText;
                            this.IsExpanded = IsExpanded;
                            this.ExpandCollapseButtonElement = ExpandCollapseButtonElement;
                        }
                        GroupState.prototype.FullGroupText = function () {
                            return this.ParentGroupText + "/" + this.GroupText;
                        };
                        return GroupState;
                    })();
                    var SaveRestoreModes;
                    (function (SaveRestoreModes) {
                        SaveRestoreModes[SaveRestoreModes["Save"] = 1] = "Save";
                        SaveRestoreModes[SaveRestoreModes["Restore"] = 2] = "Restore";
                    })(SaveRestoreModes || (SaveRestoreModes = {}));
                    var Core = (function () {
                        function Core(_Options) {
                            this._Options = _Options;
                            //#region Scroll Position
                            //private _containerScrollTop: number = 0;
                            //private _scrollPosition_Save() {
                            //	this._containerScrollTop = $(window).get(0).scrollTop;
                            //}
                            //private _scrollPosition_Restore() {
                            //	$(window).get(0).scrollTop = this._containerScrollTop;
                            //}
                            //#endregion
                            //#region Group Expanded/Collapsed State Tracking
                            this._groupsExpanded = [];
                            this._groupsCollapsed = [];
                            this._InitializeExtender();
                        }
                        Core.prototype.get_Options = function () {
                            return this._Options;
                        };
                        Core.prototype._InitializeExtender = function () {
                            if (this._Options.clientDataSource_AddEventHandlers) {
                                this._InitializeExtender_ClientSideData();
                            }
                            else if (this._Options.ajaxRefresh_AddEventHandlers) {
                                this._InitializeExtender_AjaxRefresh();
                            }
                        };
                        //#region AJAX Refresh Event Handlers
                        Core.prototype._InitializeExtender_AjaxRefresh = function () {
                            var _this = this;
                            var prmInstance = Sys.WebForms.PageRequestManager.getInstance();
                            if (!prmInstance) {
                                return;
                            }
                            prmInstance.add_beginRequest(function (sender, args) { return _this._PageRequestManager_BeginRequest(sender, args); });
                            prmInstance.add_endRequest(function (sender, args) { return _this._PageRequestManager_EndRequest(sender, args); });
                        };
                        Core.prototype._PageRequestManager_BeginRequest = function (sender, args) {
                            this.SaveGrouping();
                        };
                        Core.prototype._PageRequestManager_EndRequest = function (sender, args) {
                            this.RestoreGrouping();
                        };
                        //#endregion
                        //#region Client Data Source Event Handlers
                        Core.prototype._InitializeExtender_ClientSideData = function () {
                            var _this = this;
                            var grid = this.get_Grid();
                            grid.add_command(function (sender, args) { return _this._Grid_OnCommand(sender, args); });
                            grid.add_dataBound(function (sender, args) { return _this._Grid_OnDataBound(sender, args); });
                        };
                        Core.prototype._Grid_OnCommand = function (sender, args) {
                            this.SaveGrouping();
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
                        Core.prototype._beginSaveRestore = function () {
                            this._currentNestLevel = 0;
                            this._currentParentGroupPathArray = [];
                        };
                        Core.prototype._getCurrentParentGroupPath = function () {
                            if (this._currentParentGroupPathArray.length === 0) {
                                return "";
                            }
                            return this._currentParentGroupPathArray.join("/");
                        };
                        Core.prototype._SaveRestoreGroupingHeaderRowLoop = function (Mode, elementIndex, groupRowElement) {
                            var _this = this;
                            var $groupRowElement = $(groupRowElement);
                            var $groupHeaderCellElementsForCurrentRow = $groupRowElement.find(Core.groupHeaderRowCellElementSelector);
                            this._headerRowGroupProcessing($groupRowElement, $groupHeaderCellElementsForCurrentRow);
                            switch (Mode) {
                                case 1 /* Save */:
                                    $groupHeaderCellElementsForCurrentRow.each(function (elementIndex, groupCellElement) { return _this._saveGroupingHeaderCellLoop(elementIndex, groupCellElement); });
                                    break;
                                case 2 /* Restore */:
                                    $groupHeaderCellElementsForCurrentRow.each(function (elementIndex, groupCellElement) { return _this._restoreGroupingHeaderCellLoop(elementIndex, groupCellElement); });
                                    break;
                            }
                        };
                        Core.prototype._headerRowGroupProcessing = function ($groupRowElement, $groupHeaderCellElementsForCurrentRow) {
                            var nestLevel = 0;
                            var thisClass = this;
                            var groupText = "";
                            $groupHeaderCellElementsForCurrentRow.each(function (elementIndex, groupCellElement) {
                                groupText = thisClass._get_GroupText(groupCellElement);
                                if (!groupText) {
                                    nestLevel += 1;
                                    groupText = "";
                                }
                            });
                            if (nestLevel !== this._currentNestLevel) {
                                var nestLevelChange = this._currentNestLevel - nestLevel;
                                if (nestLevel === 0) {
                                    this._currentParentGroupPathArray = [];
                                }
                                else if (nestLevel < this._currentNestLevel) {
                                    for (var i = 0; i < nestLevelChange; i++) {
                                        this._currentParentGroupPathArray.pop();
                                    }
                                }
                                else if (nestLevel > this._currentNestLevel) {
                                    this._currentParentGroupPathArray.push(this._get_GroupTextByGroupRowElement($groupRowElement.prev()));
                                }
                            }
                            this._currentNestLevel = nestLevel;
                        };
                        Core.prototype._get_$GroupHeaderRowElements = function () {
                            var masterTableView = this.get_GridMasterTableView();
                            if (!masterTableView) {
                                return null;
                            }
                            return $(masterTableView.get_element()).find(Core.groupHeaderRowSelector);
                        };
                        Core.prototype._get_GroupState = function (groupHeaderTDElement, elementIndex) {
                            var tdElement_FirstChild = (groupHeaderTDElement.firstChild);
                            if (tdElement_FirstChild !== null && tdElement_FirstChild.tagName === "INPUT") {
                                var $tdElement_FirstChild = $(tdElement_FirstChild);
                                if ($tdElement_FirstChild.hasClass("rgExpand") || $tdElement_FirstChild.hasClass("rgCollapse")) {
                                    var IsExpanded = $tdElement_FirstChild.hasClass("rgCollapse");
                                    var GroupText = this._get_GroupText(groupHeaderTDElement);
                                    if (GroupText) {
                                        return new GroupState(GroupText, this._getCurrentParentGroupPath(), IsExpanded, (groupHeaderTDElement.firstChild));
                                    }
                                }
                            }
                            return null;
                        };
                        Core.prototype._get_GroupTextByGroupRowElement = function ($groupRowElement) {
                            var $groupHeaderCellElementsForCurrentRow = $groupRowElement.find(Core.groupHeaderRowCellElementSelector);
                            var groupText = null;
                            var thisClass = this;
                            $groupHeaderCellElementsForCurrentRow.each(function (elementIndex, groupCellElement) {
                                groupText = thisClass._get_GroupText(groupCellElement);
                                if (!groupText) {
                                    groupText = "";
                                }
                                else {
                                    return false;
                                }
                            });
                            return groupText;
                        };
                        Core.prototype._get_GroupText = function (groupHeaderTDElement) {
                            var tdElement_NextSibling = (groupHeaderTDElement.nextSibling);
                            if (tdElement_NextSibling !== null) {
                                var GroupText = tdElement_NextSibling.innerText;
                                if (this._Options.groupByExpressionAggregates_AutoStrip) {
                                    var groupByExpressionsProcessed = false;
                                    if (this._Options.groupByExpressionAggregates_SecondDisplayName && GroupText.indexOf(this._Options.groupByExpressionAggregates_SecondDisplayName) > -1) {
                                        GroupText = GroupText.substring(0, GroupText.indexOf("; " + this._Options.groupByExpressionAggregates_SecondDisplayName));
                                        groupByExpressionsProcessed = true;
                                    }
                                    if ((!groupByExpressionsProcessed) && GroupText.indexOf("; ") > -1) {
                                        //GroupByExpression (Aggregates) are likely present but not identified explicitly, so strip manually.
                                        GroupText = GroupText.substring(0, GroupText.indexOf("; "));
                                    }
                                }
                                var finalGroupText = GroupText.trim();
                                if (finalGroupText === "") {
                                    return null;
                                }
                                return finalGroupText;
                            }
                            return null;
                        };
                        //#endregion
                        //#region Save
                        Core.prototype._saveGroupingHeaderCellLoop = function (elementIndex, groupCellElement) {
                            var groupState = this._get_GroupState(groupCellElement, elementIndex);
                            if (groupState) {
                                if (groupState.IsExpanded) {
                                    this._groupsExpanded.push(groupState.FullGroupText());
                                }
                                else {
                                    this._groupsCollapsed.push(groupState.FullGroupText());
                                }
                            }
                        };
                        //#endregion
                        //#region Restore
                        Core.prototype._restoreGroupingHeaderCellLoop = function (elementIndex, groupCellElement) {
                            var groupState = this._get_GroupState(groupCellElement, elementIndex);
                            if (groupState) {
                                if (groupState.IsExpanded && this._groupsCollapsed.indexOf(groupState.FullGroupText()) !== -1) {
                                    groupState.ExpandCollapseButtonElement.click();
                                }
                                else if (!groupState.IsExpanded && this._groupsExpanded.indexOf(groupState.FullGroupText()) !== -1) {
                                    groupState.ExpandCollapseButtonElement.click();
                                }
                            }
                        };
                        //#endregion
                        //#endregion
                        Core.prototype.SaveGrouping = function () {
                            this.ResetGrouping();
                            //If you aren't using RadGrid scrolling, you'd want to save the container scroll position here
                            //this._scrollPosition_Save();
                            var thisClass = this;
                            this._beginSaveRestore();
                            var $groupHeaderRowElements = this._get_$GroupHeaderRowElements();
                            if (!$groupHeaderRowElements) {
                                return;
                            }
                            $groupHeaderRowElements.each(function (elementIndex, groupRowElement) { return thisClass._SaveRestoreGroupingHeaderRowLoop(1 /* Save */, elementIndex, groupRowElement); });
                        };
                        Core.prototype.RestoreGrouping = function () {
                            if (this._groupsExpanded.length === 0 && this._groupsCollapsed.length === 0) {
                                return;
                            }
                            var thisClass = this;
                            this._beginSaveRestore();
                            var $groupHeaderRowElements = this._get_$GroupHeaderRowElements();
                            if (!$groupHeaderRowElements) {
                                return;
                            }
                            $groupHeaderRowElements.each(function (elementIndex, groupRowElement) { return thisClass._SaveRestoreGroupingHeaderRowLoop(2 /* Restore */, elementIndex, groupRowElement); });
                            //If you aren't using RadGrid scrolling, you'd want to restore the container scroll position here
                            //this._scrollPosition_Restore();
                        };
                        Core.prototype.ResetGrouping = function () {
                            this._groupsExpanded = [];
                            this._groupsCollapsed = [];
                        };
                        Core.groupHeaderRowSelector = "tr.rgGroupHeader";
                        Core.groupHeaderRowCellElementSelector = "td.rgGroupCol";
                        return Core;
                    })();
                    GroupStatePreservation.Core = Core;
                })(GroupStatePreservation = RadGrid.GroupStatePreservation || (RadGrid.GroupStatePreservation = {}));
            })(RadGrid = TelerikCustom.RadGrid || (TelerikCustom.RadGrid = {}));
        })(TelerikCustom = Extenders.TelerikCustom || (Extenders.TelerikCustom = {}));
    })(Extenders = ClApps_Common.Extenders || (ClApps_Common.Extenders = {}));
})(ClApps_Common || (ClApps_Common = {}));
var Grid_GroupStatePreservation;
function ApplicationLoaded() {
    var GroupStatePreservation_Options = new ClApps_Common.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Options("RadGrid1", true, "Random Number Sum");
    Grid_GroupStatePreservation = new ClApps_Common.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Core(GroupStatePreservation_Options);
}
$telerik.$(document).ready(function () {
    ApplicationLoaded();
});
function RadAjaxManager1_requestStart(sender, eventArgs) {
    Grid_GroupStatePreservation.SaveGrouping();
}
function RadAjaxManager1_responseEnd(sender, eventArgs) {
    Grid_GroupStatePreservation.RestoreGrouping();
}
//# sourceMappingURL=GroupStatePreservation.js.map