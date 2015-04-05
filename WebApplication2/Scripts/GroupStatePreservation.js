/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/microsoft-ajax/microsoft.ajax.d.ts" />
/// <reference path="typings/telerik/telerik.web.ui.d.ts" />
/// <reference path="typings/app_shared.d.ts" />
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
                        SaveRestoreModes[SaveRestoreModes["PerformanceModeValidate"] = 3] = "PerformanceModeValidate";
                    })(SaveRestoreModes || (SaveRestoreModes = {}));
                    var Core = (function () {
                        function Core(_Options) {
                            this._Options = _Options;
                            this._pauseGroupStateChangeEventHandlers = false;
                            this._containerScrollTop = 0;
                            //#endregion
                            //#region Group Expanded/Collapsed State Tracking
                            this._groupsExpanded = [];
                            this._groupsCollapsed = [];
                            this._currentTopLevelGroupName = null;
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
                            if (gridInternalProperties._groupingSettings) {
                                Core.groupingSettings_GroupByFieldsSeparator = gridInternalProperties._groupingSettings.GroupByFieldsSeparator;
                            }
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
                            if (this._pauseGroupStateChangeEventHandlers) {
                                return;
                            }
                            this.SaveGrouping();
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
                                var containerElement;
                                if (this._Options.gridContainerSelector) {
                                    containerElement = $(this._Options.gridContainerSelector);
                                }
                                else {
                                    containerElement = this.get_$GridDataElement();
                                }
                                if (containerElement && containerElement.length === 1) {
                                    this._containerScrollTop = containerElement.get(0).scrollTop;
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
                                var containerElement;
                                if (this._Options.gridContainerSelector) {
                                    containerElement = $(this._Options.gridContainerSelector);
                                }
                                else {
                                    containerElement = this.get_$GridDataElement();
                                }
                                if (containerElement && containerElement.length === 1) {
                                    containerElement.get(0).scrollTop = this._containerScrollTop;
                                }
                                else {
                                    if (console && typeof console.log === "function") {
                                        console.log("RadGrid Group State Preservation: Scroll container not found.  Enable grid scrolling or specify a container selector in Options.");
                                    }
                                }
                            }
                        };
                        Core.prototype._groupItemAdd = function (list, value) {
                            if (list.indexOf(value) === -1) {
                                list.push(value);
                            }
                        };
                        Core.prototype._groupItemRemove = function (list, value) {
                            var itemIndex = list.indexOf(value);
                            if (itemIndex > -1) {
                                list.splice(itemIndex, 1);
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
                            var $groupHeaderCellElementsForCurrentRow = $groupRowElement.find(Core.groupHeaderCellElementSelector);
                            this._headerRowGroupProcessing($groupRowElement, $groupHeaderCellElementsForCurrentRow);
                            switch (Mode) {
                                case 1 /* Save */:
                                    $groupHeaderCellElementsForCurrentRow.each(function (elementIndex, groupCellElement) { return _this._saveGroupingHeaderCellLoop(Mode, elementIndex, groupCellElement); });
                                    break;
                                case 2 /* Restore */:
                                    $groupHeaderCellElementsForCurrentRow.each(function (elementIndex, groupCellElement) { return _this._restoreGroupingHeaderCellLoop(elementIndex, groupCellElement); });
                                    break;
                                case 3 /* PerformanceModeValidate */:
                                    $groupHeaderCellElementsForCurrentRow.each(function (elementIndex, groupCellElement) { return _this._saveGroupingHeaderCellLoop(Mode, elementIndex, groupCellElement); });
                                    break;
                            }
                        };
                        Core.prototype._get_GroupColumnDisplayName = function (GroupText) {
                            if (!GroupText || GroupText === "") {
                                return null;
                            }
                            return GroupText.substring(0, GroupText.indexOf(Core.groupColumnNameValueSplitter));
                        };
                        /*
                         * Ensure that group tracking is reset when the top-level group changes (to prevent excessive memory consumption).
                         */
                        Core.prototype._trackTopLevelGroupChanges = function (nestLevel, groupText) {
                            if (nestLevel === 0) {
                                var currentGroupColumnName = this._get_GroupColumnDisplayName(groupText);
                                if (currentGroupColumnName) {
                                    if (!this._currentTopLevelGroupName) {
                                        this._currentTopLevelGroupName = currentGroupColumnName;
                                    }
                                    else {
                                        if (this._currentTopLevelGroupName !== currentGroupColumnName) {
                                            this._currentTopLevelGroupName = currentGroupColumnName;
                                            this.ResetGrouping();
                                        }
                                    }
                                }
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
                            this._trackTopLevelGroupChanges(nestLevel, groupText);
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
                            if (tdElement_FirstChild !== null && tdElement_FirstChild.tagName === Core.groupHeaderCellToggleElementName) {
                                var $tdElement_FirstChild = $(tdElement_FirstChild);
                                if ($tdElement_FirstChild.hasClass(Core.groupExpandCollapseInputElementClass_Expand) || $tdElement_FirstChild.hasClass(Core.groupExpandCollapseInputElementClass_Collapse)) {
                                    var IsExpanded = $tdElement_FirstChild.hasClass(Core.groupExpandCollapseInputElementClass_Collapse);
                                    var GroupText = this._get_GroupText(groupHeaderTDElement);
                                    if (GroupText) {
                                        return new GroupState(GroupText, this._getCurrentParentGroupPath(), IsExpanded, (groupHeaderTDElement.firstChild));
                                    }
                                }
                            }
                            return null;
                        };
                        Core.prototype._get_GroupTextByGroupRowElement = function ($groupRowElement) {
                            var $groupHeaderCellElementsForCurrentRow = $groupRowElement.find(Core.groupHeaderCellElementSelector);
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
                                        GroupText = GroupText.substring(0, GroupText.indexOf(Core.groupingSettings_GroupByFieldsSeparator + this._Options.groupByExpressionAggregates_SecondDisplayName));
                                        groupByExpressionsProcessed = true;
                                    }
                                    if ((!groupByExpressionsProcessed) && GroupText.indexOf(Core.groupingSettings_GroupByFieldsSeparator) > -1) {
                                        //GroupByExpression (Aggregates) are likely present but not identified explicitly, so strip manually.
                                        GroupText = GroupText.substring(0, GroupText.indexOf(Core.groupingSettings_GroupByFieldsSeparator));
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
                        Core.prototype._saveGroupingHeaderCellLoop = function (Mode, elementIndex, groupCellElement) {
                            var groupState = this._get_GroupState(groupCellElement, elementIndex);
                            if (groupState) {
                                if (groupState.IsExpanded) {
                                    this._groupItemAdd(this._groupsExpanded, groupState.FullGroupText());
                                    this._groupItemRemove(this._groupsCollapsed, groupState.FullGroupText());
                                }
                                else {
                                    this._groupItemAdd(this._groupsCollapsed, groupState.FullGroupText());
                                    this._groupItemRemove(this._groupsExpanded, groupState.FullGroupText());
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
                        Core.prototype.SaveGrouping = function (resetGrouping) {
                            if (resetGrouping === void 0) { resetGrouping = false; }
                            if (resetGrouping) {
                                this.ResetGrouping();
                            }
                            this._scrollPosition_Save();
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
                                this._scrollPosition_Restore();
                                return;
                            }
                            var thisClass = this;
                            this._pauseGroupStateChangeEventHandlers = true;
                            this._beginSaveRestore();
                            var $groupHeaderRowElements = this._get_$GroupHeaderRowElements();
                            if ($groupHeaderRowElements) {
                                $groupHeaderRowElements.each(function (elementIndex, groupRowElement) { return thisClass._SaveRestoreGroupingHeaderRowLoop(2 /* Restore */, elementIndex, groupRowElement); });
                            }
                            this._scrollPosition_Restore();
                            this._pauseGroupStateChangeEventHandlers = false;
                        };
                        Core.prototype.ResetGrouping = function () {
                            this._groupsExpanded = [];
                            this._groupsCollapsed = [];
                            this._containerScrollTop = 0;
                        };
                        Core.groupHeaderRowSelector = "tr.rgGroupHeader";
                        Core.groupHeaderCellElementSelector = "td.rgGroupCol";
                        Core.groupHeaderCellToggleElementName = "INPUT";
                        Core.groupExpandCollapseInputElementClass_Expand = "rgExpand";
                        Core.groupExpandCollapseInputElementClass_Collapse = "rgCollapse";
                        Core.groupColumnNameValueSplitter = ":";
                        return Core;
                    })();
                    GroupStatePreservation.Core = Core;
                })(GroupStatePreservation = RadGrid.GroupStatePreservation || (RadGrid.GroupStatePreservation = {}));
            })(RadGrid = TelerikCustom.RadGrid || (TelerikCustom.RadGrid = {}));
        })(TelerikCustom = Extenders.TelerikCustom || (Extenders.TelerikCustom = {}));
    })(Extenders = ClApps_Common.Extenders || (ClApps_Common.Extenders = {}));
})(ClApps_Common || (ClApps_Common = {}));
//# sourceMappingURL=GroupStatePreservation.js.map