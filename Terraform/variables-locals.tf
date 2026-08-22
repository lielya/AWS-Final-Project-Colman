// define local variables
# Local Values Block
locals {
  common_tags = {
    Owner       = "llc"
    Project     = "Cloud_Final_Project"
    Environment = "Production"
  }

  vpc_name       = "colman-final-project-vpc"
  vpc_cidr_block = "10.10.0.0/16"
  
  # 3 subnets for High Availability across 3 Availability Zones
  public_subnets = ["10.10.0.0/20", "10.10.16.0/20", "10.10.32.0/20"]
}