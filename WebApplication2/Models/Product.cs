using System;
using System.Linq;

namespace WebApplication2.Models
{
	public class Product
	{
		public int ID { get; set; }

		public string Name { get; set; }

		public string Publisher { get; set; }

		public string Category { get; set; }

		public decimal Price { get; set; }
	}
}