USE AdventureWorks2019;
GO

-- استعلام بيجيب كل الجداول والأعمدة والوصف بتاعها عشان تغذي بيه الـ AI Agent
SELECT 
    s.name AS SchemaName,
    t.name AS TableName,
    c.name AS ColumnName,
    ty.name AS DataType,
    CAST(ep.value AS NVARCHAR(500)) AS ColumnDescription
FROM sys.tables t
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
INNER JOIN sys.columns c ON t.object_id = c.object_id
INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
LEFT JOIN sys.extended_properties ep 
    ON ep.major_id = t.object_id 
    AND ep.minor_id = c.column_id 
    AND ep.name = 'MS_Description'
ORDER BY SchemaName, TableName, c.column_id;