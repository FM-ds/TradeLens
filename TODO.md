# TODO

~~F: Add a [Beta] badge to the TradeLens title
~~
## BACI

Z: TODO: A brief covering note on TradeLens. "A tool to query XYZ trade data. 

Z: TODO: Covering note on BACI. "You can choose multiple XYZ. Some data is unavailable..."

~~F: TODO: Change the year dropdown on BACI.
~~
TODO: Change BACI querying from frontend
~    F: TODO FRONTEND: Remove Export/Import/All toggle and rename text fields to Exporter and Importer these map to the from_country and to_country in the API
~        - NOTES:
~        Always keep trade_type to exports. 
~    Z: TODO BACKEND: Add in country names to the API with this structure:
            RETURN: 
                product_code (int), product, year, exporter_id, exporter, importer_id, importer, value, quantity

Z: TODO: Test cases 

F: TODO: Fix BACI Data viz, especially wrt everywhere option

F: TODO: BACI dropdowns don't show for a second country until lose focus off and start focus

~F [BUT relies on Z backend switch]: TODO: Add country names to the table
~
## Autocomplete

F: TODO: Enable code search, do it by substring, prioritise. [IF A USER HAS SEARCHED MORE 2 numeric characters, and nothing else, they're searching by code. - ]
F: TODO: Switch embeddings model.

## PRODCOM

F: TODO: "Industrys" -> "Industries"
F: TODO: Support search codes

Z: TODO: Add a prodcom covering note that mentions data supression

F [NOT PRIORITY]: TODO: Not everything has an "average price/other" - handle gracefully?

# SIDEBAR
F: TODO: Change names

# Next version

TODO: Output exporter and importer columns. 
    BACI Trade query - will need a class update
        Remove 'all' option
        RETURN: 
            product_code (int), product, year, exporter_id, exporter, importer_id, importer, value, quantity
        ARGS:
            product_codes
            exporter
            importer



