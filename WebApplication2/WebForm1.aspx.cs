using System;
using System.Linq;

namespace WebApplication2
{
	public partial class WebForm1 : System.Web.UI.Page
	{
		protected void RadGrid1_NeedDataSource(object sender, Telerik.Web.UI.GridNeedDataSourceEventArgs e)
		{
			Random rnd = new Random();
			RadGrid1.DataSource = Enumerable.Range(1, 300).Select(i => new
			{
				Name = "Name" + Math.Ceiling(Convert.ToDouble(i / rnd.Next(6,12))),
				Test = "Test-" + Math.IEEERemainder(i,3),
				Desc = "Desc" + i,
				Loc = "Loc" + i,
				RandNum = rnd.Next(100)
			});
		}

		protected void Button1_Click(object sender, EventArgs e)
		{
			System.Threading.Thread.Sleep(250);
			RadGrid1.Rebind();
		}
	}
}