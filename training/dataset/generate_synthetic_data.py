#!/usr/bin/env python3
"""
Synthetic Egyptian Arabic Text-to-SQL Dataset Generator (TASK-A-03 / RO-02).
Reads Docs/schema_metadata.json and generates paired (Egyptian Arabic Prompt, T-SQL)
across all 5 business domains: Sales, Production, Purchasing, HumanResources, Person.
Outputs:
  - training/dataset/train_dataset.json (800+ samples)
  - training/dataset/val_dataset.json (200+ samples)
"""
import json
import random
from pathlib import Path
from typing import Dict, List, Any

REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = REPO_ROOT / "Docs" / "schema_metadata.json"
DATASET_DIR = Path(__file__).resolve().parent

DOMAINS = ["Sales", "Production", "Purchasing", "HumanResources", "Person"]

PHRASES = {
    "top_n": ["أكتر {n}", "أعلى {n}", "التوب {n}", "أفضل {n}", "هاتلي أول {n}"],
    "count": ["كام عدد", "كم مرة", "احسب عدد", "وريني عدد", "عدلي"],
    "sum": ["إجمالي", "مجموع", "التوتال بتاع", "احسب مجموع", "كل فلوس"],
    "avg": ["متوسط", "الأفريج بتاع", "معدل", "احسب متوسط"],
    "filter": ["اللي في", "الخاصة بـ", "بتاع", "المتعلقة بـ", "الموجودة في"],
    "year": ["السنة اللي فاتت", "سنة 2013", "سنة 2014", "آخر سنة"],
    "month": ["الشهر اللي فات", "الشهر ده", "آخر شهر", "شهر 5"],
}

TEMPLATES = {
    "Sales": [
        (
            "{top_n} زباين دفعوا فلوس {year}",
            "SELECT TOP {n} c.CustomerID, SUM(soh.TotalDue) AS TotalSpent FROM Sales.Customer c JOIN Sales.SalesOrderHeader soh ON c.CustomerID = soh.CustomerID WHERE YEAR(soh.OrderDate) = {yr} GROUP BY c.CustomerID ORDER BY TotalSpent DESC;",
            "استخراج أعلى {n} عملاء إنفاقاً خلال {year}.",
            "Table: Sales.Customer (CustomerID, PersonID, TerritoryID)\nTable: Sales.SalesOrderHeader (SalesOrderID, OrderDate, CustomerID, TotalDue)"
        ),
        (
            "{count} الأوردرات {filter} اتعملت {month}",
            "SELECT COUNT(SalesOrderID) AS TotalOrders FROM Sales.SalesOrderHeader WHERE MONTH(OrderDate) = {mo} AND YEAR(OrderDate) = 2014;",
            "حساب إجمالي عدد الطلبات المنفذة في {month}.",
            "Table: Sales.SalesOrderHeader (SalesOrderID, OrderDate, CustomerID, TotalDue, Status)"
        ),
        (
            "{sum} مبيعات مندوبين المبيعات {filter} حققوا التارجت",
            "SELECT sp.BusinessEntityID, SUM(soh.TotalDue) AS TotalSales FROM Sales.SalesPerson sp JOIN Sales.SalesOrderHeader soh ON sp.BusinessEntityID = soh.SalesPersonID WHERE soh.TotalDue >= sp.SalesQuota GROUP BY sp.BusinessEntityID;",
            "حساب إجمالي المبيعات لمندوبي المبيعات الذين تجاوزوا الحصة المستهدفة.",
            "Table: Sales.SalesPerson (BusinessEntityID, TerritoryID, SalesQuota, Bonus, SalesYTD)\nTable: Sales.SalesOrderHeader (SalesOrderID, SalesPersonID, TotalDue)"
        ),
        (
            "{avg} قيمة الطلب (AOV) {filter} منطقة القاهرة أو مصر",
            "SELECT st.Name AS TerritoryName, AVG(soh.TotalDue) AS AverageOrderValue FROM Sales.SalesOrderHeader soh JOIN Sales.SalesTerritory st ON soh.TerritoryID = st.TerritoryID GROUP BY st.Name ORDER BY AverageOrderValue DESC;",
            "حساب متوسط قيمة الطلب مقسماً حسب المنطقة البيعية.",
            "Table: Sales.SalesOrderHeader (SalesOrderID, TerritoryID, TotalDue)\nTable: Sales.SalesTerritory (TerritoryID, Name, CountryRegionCode)"
        ),
        (
            "{top_n} منتجات مبيعا من حيث الكمية {year}",
            "SELECT TOP {n} sod.ProductID, SUM(sod.OrderQty) AS TotalQuantity FROM Sales.SalesOrderDetail sod JOIN Sales.SalesOrderHeader soh ON sod.SalesOrderID = soh.SalesOrderID WHERE YEAR(soh.OrderDate) = {yr} GROUP BY sod.ProductID ORDER BY TotalQuantity DESC;",
            "استخراج أكثر {n} منتجات مبيعاً من حيث كمية الوحدات المطلوبة في {year}.",
            "Table: Sales.SalesOrderDetail (SalesOrderID, SalesOrderDetailID, OrderQty, ProductID, UnitPrice)\nTable: Sales.SalesOrderHeader (SalesOrderID, OrderDate)"
        ),
    ],
    "Production": [
        (
            "{count} المنتجات {filter} مخزونها أقل من الحد الحرج",
            "SELECT COUNT(p.ProductID) AS LowStockCount FROM Production.Product p JOIN Production.ProductInventory pi ON p.ProductID = pi.ProductID WHERE pi.Quantity < p.SafetyStockLevel;",
            "حساب عدد المنتجات التي هبط رصيدها عن الحد الأدنى للأمان.",
            "Table: Production.Product (ProductID, Name, ProductNumber, SafetyStockLevel, ReorderPoint)\nTable: Production.ProductInventory (ProductID, LocationID, Shelf, Bin, Quantity)"
        ),
        (
            "{top_n} منتجات تكلفة تصنيعها عالية",
            "SELECT TOP {n} ProductID, Name, StandardCost, ListPrice FROM Production.Product WHERE StandardCost > 0 ORDER BY StandardCost DESC;",
            "عرض أعلى {n} منتجات من حيث تكلفة التصنيع المعيارية.",
            "Table: Production.Product (ProductID, Name, ProductNumber, StandardCost, ListPrice)"
        ),
        (
            "{avg} أيام تصنيع المنتجات {filter} خط الإنتاج",
            "SELECT pc.Name AS CategoryName, AVG(p.DaysToManufacture) AS AvgDays FROM Production.Product p JOIN Production.ProductSubcategory ps ON p.ProductSubcategoryID = ps.ProductSubcategoryID JOIN Production.ProductCategory pc ON ps.ProductCategoryID = pc.ProductCategoryID GROUP BY pc.Name;",
            "حساب متوسط أيام التصنيع اللازمة للمنتجات بحسب التصنيف الرئيسي.",
            "Table: Production.Product (ProductID, ProductSubcategoryID, DaysToManufacture)\nTable: Production.ProductSubcategory (ProductSubcategoryID, ProductCategoryID, Name)\nTable: Production.ProductCategory (ProductCategoryID, Name)"
        ),
        (
            "{sum} كمية المخزون الإجمالية في كل المخازن",
            "SELECT l.Name AS LocationName, SUM(pi.Quantity) AS TotalInventory FROM Production.ProductInventory pi JOIN Production.Location l ON pi.LocationID = l.LocationID GROUP BY l.Name ORDER BY TotalInventory DESC;",
            "حساب إجمالي كميات المخزون الفيزيائي المتوفرة في مواقع التخزين المختلفة.",
            "Table: Production.ProductInventory (ProductID, LocationID, Quantity)\nTable: Production.Location (LocationID, Name, CostRate)"
        ),
    ],
    "Purchasing": [
        (
            "{top_n} موردين بنشتري منهم بضاعة",
            "SELECT TOP {n} v.BusinessEntityID, v.Name, SUM(poh.TotalDue) AS TotalPurchases FROM Purchasing.Vendor v JOIN Purchasing.PurchaseOrderHeader poh ON v.BusinessEntityID = poh.VendorID GROUP BY v.BusinessEntityID, v.Name ORDER BY TotalPurchases DESC;",
            "استخراج قائمة أكبر {n} موردين من حيث حجم المشتريات الإجمالية.",
            "Table: Purchasing.Vendor (BusinessEntityID, AccountNumber, Name, CreditRating)\nTable: Purchasing.PurchaseOrderHeader (PurchaseOrderID, VendorID, TotalDue, OrderDate)"
        ),
        (
            "{count} طلبات الشراء المتأخرة {year}",
            "SELECT COUNT(PurchaseOrderID) AS DelayedOrders FROM Purchasing.PurchaseOrderHeader WHERE Status = 3 AND YEAR(OrderDate) = {yr};",
            "حساب عدد أوامر الشراء المعلقة أو المتأخرة في {year}.",
            "Table: Purchasing.PurchaseOrderHeader (PurchaseOrderID, Status, OrderDate, ExpectedDate)"
        ),
        (
            "{sum} تكاليف الشحن المدفوعة لموردي البضائع",
            "SELECT sm.Name AS ShippingMethod, SUM(poh.Freight) AS TotalFreight FROM Purchasing.PurchaseOrderHeader poh JOIN Purchasing.ShipMethod sm ON poh.ShipMethodID = sm.ShipMethodID GROUP BY sm.Name ORDER BY TotalFreight DESC;",
            "حساب إجمالي نفقات الشحن والتوصيل المدفوعة لشركات النقل.",
            "Table: Purchasing.PurchaseOrderHeader (PurchaseOrderID, ShipMethodID, Freight)\nTable: Purchasing.ShipMethod (ShipMethodID, Name, ShipBase, ShipRate)"
        ),
    ],
    "HumanResources": [
        (
            "{count} الموظفين في كل إدارة في الشركة",
            "SELECT d.Name AS DepartmentName, COUNT(edh.BusinessEntityID) AS Headcount FROM HumanResources.Department d JOIN HumanResources.EmployeeDepartmentHistory edh ON d.DepartmentID = edh.DepartmentID WHERE edh.EndDate IS NULL GROUP BY d.Name ORDER BY Headcount DESC;",
            "حساب عدد الموظفين النشطين في كل إدارة وتوزيع القوى العاملة.",
            "Table: HumanResources.Department (DepartmentID, Name, GroupName)\nTable: HumanResources.EmployeeDepartmentHistory (BusinessEntityID, DepartmentID, StartDate, EndDate)"
        ),
        (
            "{top_n} موظفين عندهم رصيد إجازات كبير",
            "SELECT TOP {n} e.BusinessEntityID, e.JobTitle, e.VacationHours FROM HumanResources.Employee e ORDER BY e.VacationHours DESC;",
            "عرض أعلى {n} موظفين من حيث ساعات الإجازات المتراكمة.",
            "Table: HumanResources.Employee (BusinessEntityID, NationalIDNumber, JobTitle, VacationHours, SickLeaveHours)"
        ),
        (
            "{avg} متوسط المرتب ومعدل الأجر في إدارة المبيعات",
            "SELECT d.Name, AVG(eph.Rate) AS AverageHourlyRate FROM HumanResources.EmployeePayHistory eph JOIN HumanResources.EmployeeDepartmentHistory edh ON eph.BusinessEntityID = edh.BusinessEntityID JOIN HumanResources.Department d ON edh.DepartmentID = d.DepartmentID WHERE edh.EndDate IS NULL GROUP BY d.Name;",
            "حساب متوسط الأجر بالساعة مقسماً على إدارات المؤسسة.",
            "Table: HumanResources.EmployeePayHistory (BusinessEntityID, RateChangeDate, Rate, PayFrequency)\nTable: HumanResources.Department (DepartmentID, Name)"
        ),
    ],
    "Person": [
        (
            "{count} العملاء اللي مسجلين بإيميل وتليفون",
            "SELECT COUNT(DISTINCT p.BusinessEntityID) AS VerifiedPersons FROM Person.Person p JOIN Person.EmailAddress ea ON p.BusinessEntityID = ea.BusinessEntityID JOIN Person.PersonPhone pp ON p.BusinessEntityID = pp.BusinessEntityID;",
            "حساب عدد الأفراد المسجل لهم عنوان بريد إلكتروني ورقم هاتف نشط.",
            "Table: Person.Person (BusinessEntityID, PersonType, FirstName, LastName)\nTable: Person.EmailAddress (BusinessEntityID, EmailAddressID, EmailAddress)\nTable: Person.PersonPhone (BusinessEntityID, PhoneNumber, PhoneNumberTypeID)"
        ),
        (
            "{top_n} مدن فيها أكبر عدد من عناوين العملاء",
            "SELECT TOP {n} a.City, COUNT(a.AddressID) AS ResidentCount FROM Person.Address a GROUP BY a.City ORDER BY ResidentCount DESC;",
            "استخراج أكثر {n} مدن تضم عناوين مسجلة للعملاء والموظفين.",
            "Table: Person.Address (AddressID, AddressLine1, City, StateProvinceID, PostalCode)"
        ),
    ],
}


def generate_samples_for_domain(domain: str, count: int, start_idx: int) -> List[Dict[str, Any]]:
    templates = TEMPLATES[domain]
    samples = []
    years = [2012, 2013, 2014]
    months = [1, 3, 5, 7, 9, 11, 12]
    top_ns = [3, 5, 10, 15, 20]

    for i in range(count):
        tmpl, sql_tmpl, expl_tmpl, schema_ctx = random.choice(templates)
        n = random.choice(top_ns)
        yr = random.choice(years)
        mo = random.choice(months)

        top_phrase = random.choice(PHRASES["top_n"]).format(n=n)
        count_phrase = random.choice(PHRASES["count"])
        sum_phrase = random.choice(PHRASES["sum"])
        avg_phrase = random.choice(PHRASES["avg"])
        filter_phrase = random.choice(PHRASES["filter"])
        year_phrase = random.choice(PHRASES["year"])
        month_phrase = random.choice(PHRASES["month"])

        prompt = tmpl.format(
            top_n=top_phrase,
            count=count_phrase,
            sum=sum_phrase,
            avg=avg_phrase,
            filter=filter_phrase,
            year=year_phrase,
            month=month_phrase,
        )

        sql = sql_tmpl.format(n=n, yr=yr, mo=mo)
        expl = expl_tmpl.format(n=n, year=year_phrase, month=month_phrase)

        sample_id = f"eg_aw_{start_idx + i:05d}"
        samples.append({
            "id": sample_id,
            "domain": domain,
            "instruction": "Convert the user question asked in Egyptian Arabic into an accurate Microsoft SQL Server T-SQL query using the provided schema.",
            "schema_context": schema_ctx,
            "input_prompt": prompt,
            "output_sql": sql,
            "explanation_ar": expl,
        })

    return samples


def main():
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    random.seed(42)

    all_samples = []
    idx_counter = 1
    # Generate 210 samples per domain -> 1050 samples total
    for domain in DOMAINS:
        domain_samples = generate_samples_for_domain(domain, 210, idx_counter)
        all_samples.extend(domain_samples)
        idx_counter += len(domain_samples)

    random.shuffle(all_samples)

    # 80/20 train/val split: 840 train, 210 val
    split_point = int(len(all_samples) * 0.8)
    train_data = all_samples[:split_point]
    val_data = all_samples[split_point:]

    train_file = DATASET_DIR / "train_dataset.json"
    val_file = DATASET_DIR / "val_dataset.json"

    with open(train_file, "w", encoding="utf-8") as f:
        json.dump(train_data, f, ensure_ascii=False, indent=2)

    with open(val_file, "w", encoding="utf-8") as f:
        json.dump(val_data, f, ensure_ascii=False, indent=2)

    print(f"Generated {len(all_samples)} synthetic Egyptian Arabic Text-to-SQL samples:")
    print(f"  * Train dataset: {len(train_data)} samples -> {train_file}")
    print(f"  * Validation dataset: {len(val_data)} samples -> {val_file}")


if __name__ == "__main__":
    main()
