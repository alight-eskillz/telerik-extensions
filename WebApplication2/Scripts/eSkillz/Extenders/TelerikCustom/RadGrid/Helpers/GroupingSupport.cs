using System;
using System.Linq;
using Telerik.Web.UI;
using System.Data;
using System.Web.UI.WebControls;

namespace WebApplication2.Extenders.TelerikCustom.RadGrid.Helpers
{
	public class GroupingSupport
	{
		public static GroupData GetGroupData(Telerik.Web.UI.RadGrid grid, GridGroupHeaderItem headerItem)
		{
			GroupData data = new GroupData();
			data.groupLevel = headerItem.GroupIndex.Split('_').Length - 1;

			data.fieldName = System.Web.HttpUtility.HtmlEncode(
				grid.MasterTableView.GroupByExpressions[Convert.ToInt32(data.groupLevel)].GroupByFields[0].FieldName);

			DataRowView groupDataRow = (DataRowView)headerItem.DataItem;
			data.fieldValue = System.Web.HttpUtility.HtmlEncode(groupDataRow[data.fieldName].ToString());

			//data.fieldName = grid.MasterTableView.GroupByExpressions[Convert.ToInt32(data.groupLevel)]
			//	.GroupByFields[0].FieldName;

			//DataRowView groupDataRow = (DataRowView)headerItem.DataItem;
			//data.fieldValue = groupDataRow[data.fieldName].ToString();
			
			return data;
		}

		public static string GetGroupDataJson(Telerik.Web.UI.RadGrid grid, GridGroupHeaderItem headerItem)
		{
			return Newtonsoft.Json.JsonConvert.SerializeObject(GroupingSupport.GetGroupData(grid, headerItem));
		}

		public static void PreRenderGroupProcessing(Telerik.Web.UI.RadGrid grid)
		{
			GridItem[] headerItems = grid.MasterTableView.GetItems(GridItemType.GroupHeader);
			foreach (GridGroupHeaderItem headerItem in headerItems)
			{
				if (headerItem.OwnerTableView.GroupHeaderTemplate != null)
				{
					return;
				}

				string groupDataJson = GroupingSupport.GetGroupDataJson(grid: grid, headerItem: headerItem);
				string groupDataAttribute = String.Format("data-gdata='{0}'", groupDataJson);

				TableCell dataCell = headerItem.DataCell;
				string groupContent = "";
				if (dataCell.Controls.Count == 0 && dataCell.Text.IndexOf("rgGroupHeaderText") < 0)
				{
					groupContent = dataCell.Text;
				}
				else
				{
					groupContent = dataCell.Text.Replace("<span class='rgGroupHeaderText'>", "").Replace("</span>", "");
				}
				dataCell.Text = String.Format("<span {0}>{1}</span>", groupDataAttribute, groupContent);
			}
		}
	}
}