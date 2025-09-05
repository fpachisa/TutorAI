variable "project_id" {
  description = "The GCP project ID"
  type        = string
  default     = "ai-tutor-prod"
}

variable "region" {
  description = "The GCP region for resources"
  type        = string
  default     = "asia-southeast1"
}

variable "zone" {
  description = "The GCP zone for resources"
  type        = string
  default     = "asia-southeast1-a"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "ai-tutor"
}


variable "min_scale" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 1
}

variable "max_scale" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 50
}

variable "cpu_limit" {
  description = "CPU limit for Cloud Run instances"
  type        = string
  default     = "2"
}

variable "memory_limit" {
  description = "Memory limit for Cloud Run instances"
  type        = string
  default     = "4Gi"
}

variable "container_concurrency" {
  description = "Number of concurrent requests per Cloud Run instance"
  type        = number
  default     = 100
}