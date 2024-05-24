use super::IntegrationExecutor;
use crate::workflow::{context, http_client::HttpClient};
use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

const THREATPOST: &str = "Threatpost";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ThreatpostExecutor;

impl IntegrationExecutor for ThreatpostExecutor {
    async fn execute(
        &self,
        client: &dyn HttpClient,
        _context: &context::Context,
        api: &str,
        _credential_name: &str,
        _parameters: &HashMap<String, String>,
    ) -> Result<serde_json::Value> {
        match api {
            "FETCH_RSS_FEED" => fetch_rss_feed(client).await,
            _ => return Err(anyhow!("API {api} not implemented for {THREATPOST}.")),
        }
    }
}

// https://threatpost.com/
async fn fetch_rss_feed(client: &dyn HttpClient) -> Result<serde_json::Value> {
    let api_url = "https://threatpost.com/feed/";

    let response = client
        .get(
            api_url,
            HashMap::new(),
            200,
            format!("Error: Failed to call {THREATPOST} API"),
        )
        .await?;

    Ok(response)
}


mod tests {
    use super::*;
    use crate::postgres::Database;
    use async_trait::async_trait;
    use serde_json::json;
    use std::sync::Arc;
    use std::collections::HashMap;

    struct MockHttpClient;
    #[async_trait]
    impl HttpClient for MockHttpClient {
        async fn get(
            &self,
            _url: &str,
            _headers: HashMap<String, String>,
            _expected_response_status: u16,
            _error_message: String,
        ) -> Result<serde_json::Value> {
            Ok(json!({
                "rss": "some feed"
            }))
        }
    }

    struct MockDb;
    #[async_trait]
    impl Database for MockDb {}

    async fn setup() -> (Arc<MockHttpClient>, context::Context) {
        let context = context::Context::init(
            "ddd54f25-0537-4e40-ab96-c93beee543de".to_string(),
            None,
            Arc::new(MockDb),
        )
        .await
        .unwrap();
        (Arc::new(MockHttpClient), context)
    }

    #[tokio::test]
    async fn test_fetch_rss_feed() {
        let (client, context) = setup().await;

        let result = ThreatpostExecutor
            .execute(
                &*client,
                &context,
                "FETCH_RSS_FEED",
                "credentials",
                &HashMap::new(),
            )
            .await;
        assert!(result.is_ok());

        let value = result.unwrap();
        assert_eq!(
            value.as_object().unwrap().get("rss").unwrap(),
            "some feed"
        );
    }
}
