# terraform/modules/cloudflare-worker/variables.tf

variable "environment" {
  description = "The deployment environment (e.g., 'production', 'development')."
  type        = string
}

variable "prefix" {
  description = "The prefix for the worker (e.g., 'prod', 'dev', 'pr-123')."
  type        = string
}

variable "cloudflare_account_id" {
  description = "The Cloudflare account ID."
  type        = string
}

variable "cloudflare_zone_id" {
  description = "The Cloudflare Zone ID for the domain."
  type        = string
}

variable "cloudflare_zone" {
  description = "The root domain name (e.g., 'example.com')."
  type        = string
}

variable "cloudflare_worker_hostname" {
  description = "The full hostname for the worker (e.g., 'example.com' or 'dev.example.com')."
  type        = string
}
