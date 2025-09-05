output "cloud_run_url" {
  description = "URL of the deployed Cloud Run service"
  value       = google_cloud_run_service.ai_tutor_app.status[0].url
}

output "load_balancer_ip" {
  description = "IP address of the load balancer"
  value       = google_compute_global_address.default.address
}

output "project_id" {
  description = "GCP project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP region"
  value       = var.region
}

output "firestore_database" {
  description = "Firestore database name"
  value       = google_firestore_database.database.name
}

output "storage_bucket_assets" {
  description = "Cloud Storage bucket for assets"
  value       = google_storage_bucket.app_assets.name
}

output "ssl_certificate" {
  description = "SSL certificate name"
  value       = google_compute_managed_ssl_certificate.default.name
}

output "cloud_function_url" {
  description = "URL of the AI conversation handler Cloud Function"
  value       = google_cloudfunctions2_function.ai_conversation_handler.service_config[0].uri
}