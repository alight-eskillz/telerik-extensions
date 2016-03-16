declare module kendo {
	module data {
		interface DataSource_Corrected extends DataSource {
			group(): Array<{
				aggregates: any;
				/**
				 * asc or desc
				 */
				dir: string;
				/**
				 * Field name.
				 */
				field: string;
			}>;
		}
	}
}

declare module Telerik.Web.UI {
	interface RadGrid_Corrected extends RadGrid {
		add_groupCollapsed(handler: Function): void;
		remove_groupCollapsed(handler: Function): void;
		add_groupExpanded(handler: Function): void;
		remove_groupExpanded(handler: Function): void;
		add_dataBound(handler: Function): void;
	}
	interface RadGridInternal extends RadGrid_Corrected {
		_clientDataSourceID: string;
	}
	interface RadClientDataSource_Corrected extends RadClientDataSource {
		get_kendoWidget(): kendo.data.DataSource_Corrected;
	}
	interface GridTableView_Corrected extends GridTableView {
		get_dataItems(): Array<GridDataItem>;
	}
	interface GridTableViewInternal extends GridTableView_Corrected {
		_data: {
			GroupByExpressions: Array<{
				/**
				 * Display name.
				 */
				alias: string;
				/**
				 * asc or desc
				 */
				dir: string;
				/**
				 * Field name.
				 */
				field: string;
			}>;
		};
	}
}

interface JSON {
    /**
      * Converts a JavaScript Object Notation (JSON) string into an object.
      * @param text A valid JSON string.
      * @param reviver A function that transforms the results. This function is called for each member of the object. 
      * If a member contains nested objects, the nested objects are transformed before the parent object is. 
      */
    parse<T>(text: string, reviver?: (key: any, value: any) => any): T;
}