using System;
using System.Collections.Generic;
using System.Linq;

namespace WebApplication2.Models
{
	public class ProductRepository : IProductRepository
	{
		private List<Product> products;
		private int currentID = 12;

		private int counter = 5;

		public ProductRepository()
		{
			this.products = new List<Product>(new Product[]
			{
				new Product
				{
					ID = 1,
					Name = "USA",
					Publisher = "John",
					Category = "Category1",
					Price = 1.05M
				},
				new Product
				{
					ID = 2,
					Name = "USA",
					Publisher = "John",
					Category = "Category2",
					Price = 3.75M
				},
				new Product
				{
					ID = 3,
					Name = "USA",
					Publisher = "Andy",
					Category = "Category2",
					Price = 2.34M
				},
				new Product
				{
					ID = 4,
					Name = "Croatia",
					Publisher = "Mike",
					Category = "Category3",
					Price = 1.63M
				},
				new Product
				{
					ID = 5,
					Name = "Croatia",
					Publisher = "Mike",
					Category = "Category4",
					Price = 5.62M
				},
				new Product
				{
					ID = 6,
					Name = "Croatia",
					Publisher = "Tom",
					Category = "Category1",
					Price = 7.68M
				},
				new Product
				{
					ID = 7,
					Name = "Croatia",
					Publisher = "Tom",
					Category = "Category1",
					Price = 8.23M
				},
				new Product
				{
					ID = 8,
					Name = "Croatia",
					Publisher = "Tom",
					Category = "Category2",
					Price = 9.44M
				},
				new Product
				{
					ID = 9,
					Name = "Germany",
					Publisher = "Daniel",
					Category = "Category2",
					Price = 0.43M
				},
				new Product
				{
					ID = 10,
					Name = "Germany",
					Publisher = "Daniel",
					Category = "Category3",
					Price = 2.12M
				},
				new Product
				{
					ID = 11,
					Name = "Germany",
					Publisher = "Steve",
					Category = "Category4",
					Price = 1.79M
				},
				new Product
				{
					ID = 12,
					Name = "Germany",
					Publisher = "Steve",
					Category = "Category4",
					Price = 4.22M
				}
			});
		}

		public IEnumerable<Product> GetAll()
		{
			return this.products.Take(this.counter++);
		}

		public Product Get(int id)
		{
			return this.products.FirstOrDefault(p => p.ID == id);
		}

		public Product Add(Product item)
		{
			if (item == null)
			{
				throw new ArgumentNullException("item");
			}
			item.ID = ++this.currentID;
			this.products.Add(item);
			return item;
		}

		public void Remove(int id)
		{
			this.products.RemoveAll(p => p.ID == id);
		}

		public bool Update(Product item)
		{
			if (item == null)
			{
				throw new ArgumentNullException("item");
			}
			int index = this.products.FindIndex(p => p.ID == item.ID);
			if (index == -1)
			{
				return false;
			}
			this.products.RemoveAt(index);
			this.products.Add(item);
			return true;
		}
	}
}