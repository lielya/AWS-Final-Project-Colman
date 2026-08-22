// Launch Template
resource "aws_launch_template" "asg-launch-template" {
  name                   = "web_servers_lt"
  image_id               = "ami-0d4d82c5fdae24f58" //change
  key_name               = "colman2024" //change
  instance_type          = "t2.micro"
  vpc_security_group_ids = [ aws_security_group.web_servers.id, aws_security_group.internal.id ]
  
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "web-servers"
    }
  }
  user_data = filebase64("init.sh") // check this line
}

// Create the ASG Itself
resource "aws_autoscaling_group" "asg" {
  name = "myASG"
  
  launch_template {
    id      = aws_launch_template.asg-launch-template.id
    version = aws_launch_template.asg-launch-template.latest_version
  }
  
  vpc_zone_identifier = module.vpc.public_subnets
  min_size            = 2
  max_size            = 2
  desired_capacity    = 2
  health_check_type   = "ELB"

  tag {
    key                 = "Name"
    value               = "myASG"
    propagate_at_launch = true
  }
}

// ALB Attachment
resource "aws_autoscaling_attachment" "asg_alb_attachment_http" {
  autoscaling_group_name = aws_autoscaling_group.asg.id
  lb_target_group_arn    = aws_lb_target_group.http.arn
}