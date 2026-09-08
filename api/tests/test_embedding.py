import tradelens.embedding as embedding

from pathlib import Path

base_directory = Path(__file__).parent.parent  # Adjust this path as needed
embeddings_data = embedding.load_embeddings_data(str(base_directory) + "/")
embedding_model, embedding_matrices = embedding.setup_embeddings(
    embeddings_data)


def test_embedding_automcomplete():
    # Core autocomplete function using embeddings
    """Test returns only responses with score above threshold.

    Ice expected to have no response above 0.8 threshold.

    Should default to string matching and return Iceland only.
    """
    search_term = "Ice"
    item_type = "countries"

    actual_response = embedding.embedding_autocomplete(
        search_term,
        item_type,
        embeddings_data,
        embedding_model,
        embedding_matrices,
        limit=5,
        min_score_threshold=0.7
    )

    expected_response = [{
        'code': 352,
        'country_name': 'Iceland',
        'country_iso2': 'IS',
        'country_iso3': 'ISL'}
    ]
    assert actual_response == expected_response

    """Test function uses string match when semantic matching scores
    are too low."""
    search_term = "Zimb"
    item_type = "countries"
    actual_response = embedding.embedding_autocomplete(
        search_term,
        item_type,
        embeddings_data,
        embedding_model, embedding_matrices,
        limit=5,
        min_score_threshold=0.7
    )

    expected_response = [{
        'code': 716,
        'country_name': 'Zimbabwe',
        'country_iso2': 'ZW',
        'country_iso3': 'ZWE'}
    ]
    assert actual_response == expected_response

    """Test function uses code match when search term is numeric"""
    search_term = "716"
    item_type = "countries"
    actual_response = embedding.embedding_autocomplete(
        search_term,
        item_type,
        embeddings_data,
        embedding_model, embedding_matrices,
        limit=5,
        min_score_threshold=0.7
    )

    expected_response = [{
        'code': 716,
        'country_name': 'Zimbabwe',
        'country_iso2': 'ZW',
        'country_iso3': 'ZWE'}
    ]
    assert actual_response == expected_response

    """Test function returns codes that start with 27011 when search term is 27011"""
    search_term = "27011"
    item_type = "hs6_products"
    actual_response = embedding.embedding_autocomplete(
        search_term,
        item_type,
        embeddings_data,
        embedding_model, embedding_matrices,
        limit=5,
        min_score_threshold=0.7
    )

    expected_response = [
        {'code': 270111, 'description': 'Coal: anthracite, whether or not pulverised, but not agglomerated'},
        {'code': 270112, 'description': 'Coal: bituminous, whether or not pulverised, but not agglomerated'},
        {'code': 270119, 'description': 'Coal: (other than anthracite and bituminous), whether or not pulverised but not agglomerated'}]
    assert actual_response == expected_response

    """Test function returns codes that ALL start with 2 when search term is 2"""
    search_term = "2"
    item_type = "hs6_products"
    actual_response = embedding.embedding_autocomplete(
        search_term,
        item_type,
        embeddings_data,
        embedding_model, embedding_matrices,
        limit=5,
        min_score_threshold=0.7
    )

    assert all(["2" == str(response["code"])[0]
               for response in actual_response])

    """Test function checks for search term in item name when search term
    longer than 3 characters"""
    search_term = "beki"
    item_type = "countries"
    actual_response = embedding.embedding_autocomplete(
        search_term,
        item_type,
        embeddings_data,
        embedding_model, embedding_matrices,
        limit=5,
        min_score_threshold=0.7
    )

    expected_response = [{
        'code': 860,
        'country_name': 'Uzbekistan',
        'country_iso2': 'UZ',
        'country_iso3': 'UZB'}
    ]
    assert actual_response == expected_response
