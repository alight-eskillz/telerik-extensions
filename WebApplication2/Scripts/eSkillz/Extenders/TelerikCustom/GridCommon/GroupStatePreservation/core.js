/// <reference path="../../../../../typings/app_shared.d.ts" />
/// <reference path="../../../../../typings/telerik/telerik.web.ui.d.ts" />
/// <reference path="../../../../../typings/microsoft-ajax/microsoft.ajax.d.ts" />
/// <reference path="../../../../../typings/jquery/jquery.d.ts" />
var eSkillz;
(function (eSkillz) {
    var Extenders;
    (function (Extenders) {
        var TelerikCustom;
        (function (TelerikCustom) {
            var GridCommon;
            (function (GridCommon) {
                var GroupStatePreservation;
                (function (GroupStatePreservation) {
                    var SaveRestoreModes;
                    (function (SaveRestoreModes) {
                        SaveRestoreModes[SaveRestoreModes["Save"] = 1] = "Save";
                        SaveRestoreModes[SaveRestoreModes["Restore"] = 2] = "Restore";
                    })(SaveRestoreModes || (SaveRestoreModes = {}));
                    var GroupState = (function () {
                        function GroupState(GroupText, ParentGroupText, CheckToggleButtonResult) {
                            this.GroupText = GroupText;
                            this.ParentGroupText = ParentGroupText;
                            this.CheckToggleButtonResult = CheckToggleButtonResult;
                        }
                        GroupState.prototype.FullGroupText = function () {
                            return this.ParentGroupText + "/" + this.GroupText;
                        };
                        return GroupState;
                    })();
                    var Options = (function () {
                        function Options(groupHeaderElementSelector, groupHeaderChildren_ToggleElementSelector, groupHeaderChildren_ToggleElementSelectorFilter, groupHeaderChildren_TextElementSelector, groupHeaderChildren_TextElementSelectorFilter, groupToggleElementClass_Expand, groupToggleElementClass_Collapse, groupingSettings_GroupByFieldsSeparator, implementationOptions, groupColumnNameValueSplitter, groupHeaderTextElementClass) {
                            if (groupColumnNameValueSplitter === void 0) { groupColumnNameValueSplitter = ":"; }
                            if (groupHeaderTextElementClass === void 0) { groupHeaderTextElementClass = null; }
                            this.groupHeaderElementSelector = groupHeaderElementSelector;
                            this.groupHeaderChildren_ToggleElementSelector = groupHeaderChildren_ToggleElementSelector;
                            this.groupHeaderChildren_ToggleElementSelectorFilter = groupHeaderChildren_ToggleElementSelectorFilter;
                            this.groupHeaderChildren_TextElementSelector = groupHeaderChildren_TextElementSelector;
                            this.groupHeaderChildren_TextElementSelectorFilter = groupHeaderChildren_TextElementSelectorFilter;
                            this.groupToggleElementClass_Expand = groupToggleElementClass_Expand;
                            this.groupToggleElementClass_Collapse = groupToggleElementClass_Collapse;
                            this.groupingSettings_GroupByFieldsSeparator = groupingSettings_GroupByFieldsSeparator;
                            this.implementationOptions = implementationOptions;
                            this.groupColumnNameValueSplitter = groupColumnNameValueSplitter;
                            this.groupHeaderTextElementClass = groupHeaderTextElementClass;
                        }
                        return Options;
                    })();
                    GroupStatePreservation.Options = Options;
                    var Core = (function () {
                        function Core(_Options) {
                            this._Options = _Options;
                            //#endregion
                            //#endregion
                            //#region Group Expanded/Collapsed State Tracking
                            this._groupsExpanded = [];
                            this._groupsCollapsed = [];
                            //#region Pause Processing
                            this._pauseGroupStateChangeEventHandlers = false;
                            this._currentTopLevelGroupName = null;
                            //#endregion
                            //#endregion
                            //#region Save Grouping
                            //#region Asynchronous
                            this._saveGroupingElementInterval = null;
                        }
                        Core.prototype.get_Options = function () {
                            return this._Options;
                        };
                        Core.prototype.set_tableElement = function ($element) {
                            this._$tableElement = $element;
                        };
                        Core.prototype._get_$GroupHeaderElements = function () {
                            if (!this._$tableElement || this._$tableElement.length === 0) {
                                return null;
                            }
                            return this._$tableElement.find(this._Options.groupHeaderElementSelector);
                        };
                        Core.prototype._get_$groupHeaderChildElements = function (selector, selectorFilter) {
                            var $elements = this._get_$GroupHeaderElements().find(selector);
                            if (selectorFilter && selectorFilter !== "") {
                                return $elements.filter(selectorFilter);
                            }
                            else {
                                return $elements;
                            }
                        };
                        Core.prototype._get_$GroupHeaderChildElementWithinHeader = function ($groupHeaderElement, selector, selectorFilter) {
                            var $element = $groupHeaderElement.find(selector);
                            if (selectorFilter && selectorFilter !== "") {
                                return $element.filter(selectorFilter);
                            }
                            else {
                                return $element;
                            }
                        };
                        Core.prototype._$find_GroupTextElements = function ($preFindElements) {
                            if (this._Options.groupHeaderTextElementClass && $preFindElements.length > 0) {
                                return $preFindElements.find("." + this._Options.groupHeaderTextElementClass);
                            }
                            else {
                                return $preFindElements;
                            }
                        };
                        //#region Expand/Collapse Elements
                        Core.prototype._get_$groupToggleElementsAll = function () {
                            return this._get_$groupHeaderChildElements(this._Options.groupHeaderChildren_ToggleElementSelector, this._Options.groupHeaderChildren_ToggleElementSelectorFilter);
                        };
                        Core.prototype._get_$groupToggleElementInHeader = function ($groupHeaderElement) {
                            return this._get_$GroupHeaderChildElementWithinHeader($groupHeaderElement, this._Options.groupHeaderChildren_ToggleElementSelector, this._Options.groupHeaderChildren_ToggleElementSelectorFilter);
                        };
                        //#endregion
                        //#region Text Elements
                        Core.prototype._get_$GroupTextElementsAll = function () {
                            return this._$find_GroupTextElements(this._get_$groupHeaderChildElements(this._Options.groupHeaderChildren_TextElementSelector, this._Options.groupHeaderChildren_TextElementSelectorFilter));
                        };
                        Core.prototype._get_$groupTextElementInHeader = function ($groupHeaderElement) {
                            return this._$find_GroupTextElements(this._get_$GroupHeaderChildElementWithinHeader($groupHeaderElement, this._Options.groupHeaderChildren_TextElementSelector, this._Options.groupHeaderChildren_TextElementSelectorFilter));
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
                        Core.prototype.set_pauseGroupStateChangeEventHandlers = function (value) {
                            this._pauseGroupStateChangeEventHandlers = value;
                        };
                        Core.prototype.get_pauseGroupStateChangeEventHandlers = function () {
                            return this._pauseGroupStateChangeEventHandlers;
                        };
                        Core.prototype._beginSaveRestore = function () {
                            this._lastNestLevel = -1;
                            this._nestingRootColSpan = -1;
                            this._currentParentGroupPathArray = [];
                        };
                        Core.prototype._getCurrentParentGroupPath = function () {
                            if (this._currentParentGroupPathArray.length === 0) {
                                return "";
                            }
                            return this._currentParentGroupPathArray.join("/");
                        };
                        Core.prototype._SaveRestoreGroupHeaderLoopHandler = function (Mode, elementIndex, groupHeaderElement) {
                            var $groupHeaderElement = $(groupHeaderElement);
                            this._groupHeaderNestLevelProcessing($groupHeaderElement);
                            switch (Mode) {
                                case 1 /* Save */:
                                    this._saveGroupingForHeaderElement($groupHeaderElement);
                                    break;
                                case 2 /* Restore */:
                                    this._restoreGroupingForHeaderElement($groupHeaderElement);
                                    break;
                            }
                        };
                        Core.prototype._get_GroupColumnDisplayName = function (GroupText) {
                            if (!GroupText || GroupText === "") {
                                return null;
                            }
                            return GroupText.substring(0, GroupText.indexOf(this._Options.groupColumnNameValueSplitter));
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
                        /**
                         * Determine nesting level/changes.
                         */
                        Core.prototype._groupHeaderNestLevelProcessing = function ($groupHeaderElement) {
                            var groupHeaderLastChildElement = (this._get_$groupTextElementInHeader($groupHeaderElement).get(0));
                            var groupText = this._get_GroupText($groupHeaderElement);
                            if (this._lastNestLevel === -1) {
                                this._nestingRootColSpan = groupHeaderLastChildElement.colSpan;
                            }
                            var nestLevel = (this._nestingRootColSpan - groupHeaderLastChildElement.colSpan);
                            if (nestLevel !== this._lastNestLevel) {
                                var nestLevelChange = this._lastNestLevel - nestLevel;
                                if (nestLevel === 0) {
                                    this._currentParentGroupPathArray = [];
                                }
                                else if (nestLevel < this._lastNestLevel) {
                                    for (var i = 0; i < nestLevelChange; i++) {
                                        this._currentParentGroupPathArray.pop();
                                    }
                                }
                                else if (nestLevel > this._lastNestLevel) {
                                    this._currentParentGroupPathArray.push(this._get_GroupText($groupHeaderElement.prev()));
                                }
                            }
                            this._lastNestLevel = nestLevel;
                            this._trackTopLevelGroupChanges(nestLevel, groupText);
                        };
                        Core.prototype._checkToggleButton = function ($groupHeaderElement) {
                            var $toggleButtonElement = this._get_$groupToggleElementInHeader($groupHeaderElement);
                            if ($toggleButtonElement.length > 0) {
                                if ($toggleButtonElement.hasClass(this._Options.groupToggleElementClass_Expand) || $toggleButtonElement.hasClass(this._Options.groupToggleElementClass_Collapse)) {
                                    return {
                                        IsToggleButton: true,
                                        ToggleStateIsExpanded: $toggleButtonElement.hasClass(this._Options.groupToggleElementClass_Collapse),
                                        ToggleButtonElement: $toggleButtonElement
                                    };
                                }
                            }
                            return { IsToggleButton: false };
                        };
                        Core.prototype._get_GroupState = function ($groupHeaderElement) {
                            var GroupText = this._get_GroupText($groupHeaderElement);
                            if (GroupText) {
                                var _checkToggleButtonResult = this._checkToggleButton($groupHeaderElement);
                                return new GroupState(GroupText, this._getCurrentParentGroupPath(), _checkToggleButtonResult);
                            }
                            return null;
                        };
                        Core.prototype._get_GroupText = function ($groupHeaderElement) {
                            if ($groupHeaderElement.length === 0) {
                                return null;
                            }
                            var $groupTextElement = this._get_$groupTextElementInHeader($groupHeaderElement);
                            if ($groupTextElement.length === 0) {
                                return null;
                            }
                            var groupText = $groupTextElement.text();
                            if (this._Options.implementationOptions.groupByExpressionAggregates_AutoStrip) {
                                var groupByExpressionsProcessed = false;
                                if (this._Options.implementationOptions.groupByExpressionAggregates_SecondDisplayName && groupText.indexOf(this._Options.implementationOptions.groupByExpressionAggregates_SecondDisplayName) > -1) {
                                    groupText = groupText.substring(0, groupText.indexOf(this._Options.groupingSettings_GroupByFieldsSeparator + this._Options.implementationOptions.groupByExpressionAggregates_SecondDisplayName));
                                    groupByExpressionsProcessed = true;
                                }
                                if ((!groupByExpressionsProcessed) && groupText.indexOf(this._Options.groupingSettings_GroupByFieldsSeparator) > -1) {
                                    //GroupByExpression (Aggregates) are likely present but not identified explicitly, so strip manually.
                                    groupText = groupText.substring(0, groupText.indexOf(this._Options.groupingSettings_GroupByFieldsSeparator));
                                }
                            }
                            var finalGroupText = groupText.trim();
                            if (finalGroupText === "") {
                                return null;
                            }
                            return finalGroupText;
                        };
                        //#endregion
                        //#region Save
                        Core.prototype._saveGroupingForHeaderElement = function ($groupHeaderElement) {
                            var groupState = this._get_GroupState($groupHeaderElement);
                            if (groupState) {
                                if (groupState.CheckToggleButtonResult.ToggleStateIsExpanded) {
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
                        Core.prototype._restoreGroupingForHeaderElement = function ($groupHeaderElement) {
                            var groupState = this._get_GroupState($groupHeaderElement);
                            if (groupState) {
                                if (groupState.CheckToggleButtonResult.ToggleStateIsExpanded && this._groupsCollapsed.indexOf(groupState.FullGroupText()) !== -1) {
                                    groupState.CheckToggleButtonResult.ToggleButtonElement.click();
                                }
                                else if (!groupState.CheckToggleButtonResult.ToggleStateIsExpanded && this._groupsExpanded.indexOf(groupState.FullGroupText()) !== -1) {
                                    groupState.CheckToggleButtonResult.ToggleButtonElement.click();
                                }
                            }
                        };
                        Core.prototype.SaveGroupingAsync = function ($tableElement, resetGrouping) {
                            if (resetGrouping === void 0) { resetGrouping = false; }
                            console.log("Begin save grouping...");
                            this.set_tableElement($tableElement);
                            if (resetGrouping) {
                                this.ResetGrouping();
                            }
                            this._saveGroupingWaitCheck();
                        };
                        Core.prototype._saveGroupingWaitCheck = function () {
                            if (this._saveGroupingElementInterval) {
                                this._saveGroupingAsyncStop();
                            }
                            this._saveGroupingContinue();
                        };
                        Core.prototype._saveGroupingContinue = function () {
                            var _this = this;
                            this._beginSaveRestore();
                            var $groupHeaderElements = this._get_$GroupHeaderElements();
                            if (!$groupHeaderElements) {
                                return;
                            }
                            var elementIndex = 0;
                            var elementsLength = $groupHeaderElements.length;
                            this._saveGroupingElementInterval = setInterval(function () {
                                for (var batchIndex = 0; batchIndex < 20 && elementIndex < elementsLength; batchIndex++) {
                                    _this._SaveRestoreGroupHeaderLoopHandler(1 /* Save */, elementIndex, $groupHeaderElements.get(elementIndex));
                                    elementIndex++;
                                }
                                if (elementIndex >= elementsLength) {
                                    _this._saveGroupingAsyncStop();
                                    console.log("Save complete, processed " + (elementIndex + 1).toString() + " elements.");
                                }
                            }, 0);
                        };
                        Core.prototype._saveGroupingAsyncStop = function () {
                            clearInterval(this._saveGroupingElementInterval);
                            this._saveGroupingElementInterval = null;
                        };
                        //#endregion
                        //#region Synchronous
                        Core.prototype._saveGrouping = function () {
                            var thisClass = this;
                            var $groupHeaderElements = this._get_$GroupHeaderElements();
                            if ($groupHeaderElements) {
                                $groupHeaderElements.each(function (elementIndex, groupHeaderElement) { return thisClass._SaveRestoreGroupHeaderLoopHandler(1 /* Save */, elementIndex, groupHeaderElement); });
                            }
                        };
                        Core.prototype.FinishSaveGroupingCheck = function () {
                            if (this._saveGroupingElementInterval) {
                                this._saveGroupingAsyncStop();
                                this._saveGrouping();
                            }
                        };
                        //#endregion
                        //#endregion
                        Core.prototype.RestoreGrouping = function ($tableElement) {
                            if (this._groupsExpanded.length === 0 && this._groupsCollapsed.length === 0) {
                                return;
                            }
                            if (this._saveGroupingElementInterval) {
                                clearInterval(this._saveGroupingElementInterval);
                            }
                            this.set_tableElement($tableElement);
                            var thisClass = this;
                            this._pauseGroupStateChangeEventHandlers = true;
                            this._beginSaveRestore();
                            var $groupHeaderElements = this._get_$GroupHeaderElements();
                            if ($groupHeaderElements) {
                                $groupHeaderElements.each(function (elementIndex, groupHeaderElement) { return thisClass._SaveRestoreGroupHeaderLoopHandler(2 /* Restore */, elementIndex, groupHeaderElement); });
                            }
                            this._pauseGroupStateChangeEventHandlers = false;
                        };
                        Core.prototype.ResetGrouping = function () {
                            this._groupsExpanded = [];
                            this._groupsCollapsed = [];
                        };
                        return Core;
                    })();
                    GroupStatePreservation.Core = Core;
                })(GroupStatePreservation = GridCommon.GroupStatePreservation || (GridCommon.GroupStatePreservation = {}));
            })(GridCommon = TelerikCustom.GridCommon || (TelerikCustom.GridCommon = {}));
        })(TelerikCustom = Extenders.TelerikCustom || (Extenders.TelerikCustom = {}));
    })(Extenders = eSkillz.Extenders || (eSkillz.Extenders = {}));
})(eSkillz || (eSkillz = {}));
//# sourceMappingURL=core.js.map