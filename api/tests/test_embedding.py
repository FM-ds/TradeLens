import tradelens.embedding as embedding

from pathlib import Path

base_directory = Path(__file__).parent.parent  # Adjust this path as needed
embeddings_data = embedding.load_embeddings_data(str(base_directory) + "/")
embedding_model, embedding_matrices = embedding.setup_embeddings(
    embeddings_data)


def test_embedding_automcomplete():
    # Core autocomplete function using embeddings
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
        embedding_model,
        embedding_matrices,
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
        'country_name': 'Zimbabwe',
        'country_iso2': 'ZW',
        'country_iso3': 'ZWE'}
    ]
    assert actual_responce == expected_responce

    """Test function uses code match when search term is code"""
    search_term = "716"
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
        'country_name': 'Zimbabwe',
        'country_iso2': 'ZW',
        'country_iso3': 'ZWE'}
    ]
    assert actual_responce == expected_responce

    """Test function checks for search term in item name when search term
    longer than 3 characters"""
    search_term = "beki"
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
        'code': 860,
        'country_name': 'Uzbekistan',
        'country_iso2': 'UZ',
        'country_iso3': 'UZB'}
    ]
    assert actual_responce == expected_responce
