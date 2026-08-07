import tradelens.embedding as embedding

embeddings_data = embedding.load_embeddings_data()
embedding_model, embedding_matrices = embedding.setup_embeddings(embeddings_data)


def test_embedding_automcomplete():
    #### Core autocomplete function using embeddings
    """Test returns only responces with score above threshold.
    
    Ice expected to have one responce above 0.7 threshold
    which is Greenland.
    
    """
    search_term = "Ice"
    item_type = "countries"

    actual_responce = embedding.embedding_autocomplete(
        search_term,
        item_type,
        embeddings_data,
        embedding_model, embedding_matrices,
        limit=5,
        min_score_threshold=0.7
    )

    expected_responce = [{
        'code': 304,
        'country_name': 'Greenland',
        'country_iso2': 'GL',
        'country_iso3': 'GRL'}
]
    assert actual_responce == expected_responce

    """Test function uses string match when semantic matching scores
    are too low."""
    search_term = "Zimb"
    item_type = "countries"
    actual_responce = embedding.embedding_autocomplete(
        search_term,
        item_type,
        embeddings_data,
        embedding_model, embedding_matrices,
        limit=5,
        min_score_threshold=0.7
    )

    expected_responce = [{
        'code': 716,
        'country_name': 'Zimb',
        'country_iso2': 'ZW',
        'country_iso3': 'ZWE'}
]
    assert actual_responce == expected_responce
