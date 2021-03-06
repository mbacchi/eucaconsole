# Copyright 2015 Eucalyptus Systems, Inc.
#
# Redistribution and use of this software in source and binary forms,
# with or without modification, are permitted provided that the following
# conditions are met:
#
# Redistributions of source code must retain the above copyright notice,
# this list of conditions and the following disclaimer.
#
# Redistributions in binary form must reproduce the above copyright
# notice, this list of conditions and the following disclaimer in the
# documentation and/or other materials provided with the distribution.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
# OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
# SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
# LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
# DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
# THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

import unittest
import simplejson as json

class TestAWSConvert(unittest.TestCase):
    def test_aws_convert(self):
        from eucaconsole.views.stacks import StackWizardView
        # this is an actual aws template that contains RDS resources
        template = """
            {
              "AWSTemplateFormatVersion" : "2010-09-09",

              "Description" : "AWS CloudFormation Sample Template LAMP_Multi_AZ: Create a highly available, scalable LAMP stack with an Amazon RDS database instance for the backend data store. This template demonstrates using the AWS CloudFormation bootstrap scripts to install the packages and files necessary to deploy the Apache web server and PHP at instance launch time. **WARNING** This template creates one or more Amazon EC2 instances, an Elastic Load Balancer and an Amazon RDS DB instance. You will be billed for the AWS resources used if you create a stack from this template.",

              "Parameters" : {

                "KeyName": {
                  "Description" : "Name of an existing EC2 KeyPair to enable SSH access to the instances",
                  "Type": "AWS::EC2::KeyPair::KeyName",
                  "ConstraintDescription" : "must be the name of an existing EC2 KeyPair."
                },

                "DBName": {
                  "Default": "myDatabase",
                  "Description" : "MySQL database name",
                  "Type": "String",
                  "MinLength": "1",
                  "MaxLength": "64",
                  "AllowedPattern" : "[a-zA-Z][a-zA-Z0-9]*",
                  "ConstraintDescription" : "must begin with a letter and contain only alphanumeric characters."
                },

                "DBUser": {
                  "NoEcho": "true",
                  "Description" : "Username for MySQL database access",
                  "Type": "String",
                  "MinLength": "1",
                  "MaxLength": "16",
                  "AllowedPattern" : "[a-zA-Z][a-zA-Z0-9]*",
                  "ConstraintDescription" : "must begin with a letter and contain only alphanumeric characters."
                },

                "DBPassword": {
                  "NoEcho": "true",
                  "Description" : "Password for MySQL database access",
                  "Type": "String",
                  "MinLength": "8",
                  "MaxLength": "41",
                  "AllowedPattern" : "[a-zA-Z0-9]*",
                  "ConstraintDescription" : "must contain only alphanumeric characters."
                },

                "DBAllocatedStorage": {
                  "Default": "5",
                  "Description" : "The size of the database (Gb)",
                  "Type": "Number",
                  "MinValue": "5",
                  "MaxValue": "1024",
                  "ConstraintDescription" : "must be between 5 and 1024Gb."
                },

                "DBInstanceClass": {
                  "Description" : "The database instance type",
                  "Type": "String",
                  "Default": "db.m1.small",
                  "AllowedValues" : [ "db.t1.micro", "db.m1.small", "db.m1.medium", "db.m1.large", "db.m1.xlarge", "db.m2.xlarge", "db.m2.2xlarge", "db.m2.4xlarge", "db.m3.medium", "db.m3.large", "db.m3.xlarge", "db.m3.2xlarge", "db.r3.large", "db.r3.xlarge", "db.r3.2xlarge", "db.r3.4xlarge", "db.r3.8xlarge", "db.m2.xlarge", "db.m2.2xlarge", "db.m2.4xlarge", "db.cr1.8xlarge"]
            ,
                  "ConstraintDescription" : "must select a valid database instance type."
                },

                "MultiAZDatabase": {
                  "Default": "true",
                  "Description" : "Create a Multi-AZ MySQL Amazon RDS database instance",
                  "Type": "String",
                  "AllowedValues" : [ "true", "false" ],
                  "ConstraintDescription" : "must be either true or false."
                },

                "WebServerCapacity": {
                  "Default": "2",
                  "Description" : "The initial nuber of WebServer instances",
                  "Type": "Number",
                  "MinValue": "1",
                  "MaxValue": "5",
                  "ConstraintDescription" : "must be between 1 and 5 EC2 instances."
                },

                "InstanceType" : {
                  "Description" : "WebServer EC2 instance type",
                  "Type" : "String",
                  "Default" : "m1.small",
                  "AllowedValues" : [ "t1.micro", "t2.micro", "t2.small", "t2.medium", "m1.small", "m1.medium", "m1.large", "m1.xlarge", "m2.xlarge", "m2.2xlarge", "m2.4xlarge", "m3.medium", "m3.large", "m3.xlarge", "m3.2xlarge", "c1.medium", "c1.xlarge", "c3.large", "c3.xlarge", "c3.2xlarge", "c3.4xlarge", "c3.8xlarge", "c4.large", "c4.xlarge", "c4.2xlarge", "c4.4xlarge", "c4.8xlarge", "g2.2xlarge", "r3.large", "r3.xlarge", "r3.2xlarge", "r3.4xlarge", "r3.8xlarge", "i2.xlarge", "i2.2xlarge", "i2.4xlarge", "i2.8xlarge", "hi1.4xlarge", "hs1.8xlarge", "cr1.8xlarge", "cc2.8xlarge", "cg1.4xlarge"]
            ,
                  "ConstraintDescription" : "must be a valid EC2 instance type."
                },
                "SSHLocation" : {
                  "Description" : " The IP address range that can be used to SSH to the EC2 instances",
                  "Type": "String",
                  "MinLength": "9",
                  "MaxLength": "18",
                  "Default": "0.0.0.0/0",
                  "AllowedPattern": "(\\\d{1,3})\\\.(\\\d{1,3})\\\.(\\\d{1,3})\\\.(\\\d{1,3})/(\\\d{1,2})",
                  "ConstraintDescription": "must be a valid IP CIDR range of the form x.x.x.x/x."
                }
              },

              "Mappings" : {
                "AWSInstanceType2Arch" : {
                  "t1.micro"    : { "Arch" : "PV64"   },
                  "t2.micro"    : { "Arch" : "HVM64"  },
                  "t2.small"    : { "Arch" : "HVM64"  },
                  "t2.medium"   : { "Arch" : "HVM64"  },
                  "m1.small"    : { "Arch" : "PV64"   },
                  "m1.medium"   : { "Arch" : "PV64"   },
                  "m1.large"    : { "Arch" : "PV64"   },
                  "m1.xlarge"   : { "Arch" : "PV64"   },
                  "m2.xlarge"   : { "Arch" : "PV64"   },
                  "m2.2xlarge"  : { "Arch" : "PV64"   },
                  "m2.4xlarge"  : { "Arch" : "PV64"   },
                  "m3.medium"   : { "Arch" : "HVM64"  },
                  "m3.large"    : { "Arch" : "HVM64"  },
                  "m3.xlarge"   : { "Arch" : "HVM64"  },
                  "m3.2xlarge"  : { "Arch" : "HVM64"  },
                  "c1.medium"   : { "Arch" : "PV64"   },
                  "c1.xlarge"   : { "Arch" : "PV64"   },
                  "c3.large"    : { "Arch" : "HVM64"  },
                  "c3.xlarge"   : { "Arch" : "HVM64"  },
                  "c3.2xlarge"  : { "Arch" : "HVM64"  },
                  "c3.4xlarge"  : { "Arch" : "HVM64"  },
                  "c3.8xlarge"  : { "Arch" : "HVM64"  },
                  "c4.large"    : { "Arch" : "HVM64"  },
                  "c4.xlarge"   : { "Arch" : "HVM64"  },
                  "c4.2xlarge"  : { "Arch" : "HVM64"  },
                  "c4.4xlarge"  : { "Arch" : "HVM64"  },
                  "c4.8xlarge"  : { "Arch" : "HVM64"  },
                  "g2.2xlarge"  : { "Arch" : "HVMG2"  },
                  "r3.large"    : { "Arch" : "HVM64"  },
                  "r3.xlarge"   : { "Arch" : "HVM64"  },
                  "r3.2xlarge"  : { "Arch" : "HVM64"  },
                  "r3.4xlarge"  : { "Arch" : "HVM64"  },
                  "r3.8xlarge"  : { "Arch" : "HVM64"  },
                  "i2.xlarge"   : { "Arch" : "HVM64"  },
                  "i2.2xlarge"  : { "Arch" : "HVM64"  },
                  "i2.4xlarge"  : { "Arch" : "HVM64"  },
                  "i2.8xlarge"  : { "Arch" : "HVM64"  },
                  "hi1.4xlarge" : { "Arch" : "HVM64"  },
                  "hs1.8xlarge" : { "Arch" : "HVM64"  },
                  "cr1.8xlarge" : { "Arch" : "HVM64"  },
                  "cc2.8xlarge" : { "Arch" : "HVM64"  }
                }
            ,
                "AWSRegionArch2AMI" : {
                  "us-east-1"        : {"PV64" : "ami-50311038", "HVM64" : "ami-5231103a", "HVMG2" : "ami-8c6b40e4"},
                  "us-west-2"        : {"PV64" : "ami-5d79546d", "HVM64" : "ami-43795473", "HVMG2" : "ami-abbe919b"},
                  "us-west-1"        : {"PV64" : "ami-eb4fa8af", "HVM64" : "ami-f74fa8b3", "HVMG2" : "ami-f31ffeb7"},
                  "eu-west-1"        : {"PV64" : "ami-a71588d0", "HVM64" : "ami-a51588d2", "HVMG2" : "ami-d5bc24a2"},
                  "eu-central-1"     : {"PV64" : "ami-ac5c61b1", "HVM64" : "ami-a25c61bf", "HVMG2" : "ami-7cd2ef61"},
                  "ap-northeast-1"   : {"PV64" : "ami-8d1df78d", "HVM64" : "ami-a51df7a5", "HVMG2" : "ami-6318e863"},
                  "ap-southeast-1"   : {"PV64" : "ami-887041da", "HVM64" : "ami-5e73420c", "HVMG2" : "ami-3807376a"},
                  "ap-southeast-2"   : {"PV64" : "ami-bb1e6e81", "HVM64" : "ami-ad1e6e97", "HVMG2" : "ami-89790ab3"},
                  "sa-east-1"        : {"PV64" : "ami-29aa1234", "HVM64" : "ami-27aa123a", "HVMG2" : "NOT_SUPPORTED"},
                  "cn-north-1"       : {"PV64" : "ami-503aa869", "HVM64" : "ami-543aa86d", "HVMG2" : "NOT_SUPPORTED"}
                }

              },

              "Conditions" : {
                "Is-EC2-VPC"     : { "Fn::Or" : [ {"Fn::Equals" : [{"Ref" : "AWS::Region"}, "eu-central-1" ]},
                                                  {"Fn::Equals" : [{"Ref" : "AWS::Region"}, "cn-north-1" ]}]},
                "Is-EC2-Classic" : { "Fn::Not" : [{ "Condition" : "Is-EC2-VPC"}]}
              },

              "Resources" : {

                "ElasticLoadBalancer" : {
                  "Type" : "AWS::ElasticLoadBalancing::LoadBalancer",
                  "Properties" : {
                    "CrossZone" : "true",
                    "AvailabilityZones" : { "Fn::GetAZs" : "" },
                    "LBCookieStickinessPolicy" : [ {
                      "PolicyName" : "CookieBasedPolicy",
                      "CookieExpirationPeriod" : "30"
                    } ],
                    "Listeners" : [ {
                      "LoadBalancerPort" : "80",
                      "InstancePort" : "80",
                      "Protocol" : "HTTP",
                      "PolicyNames" : [ "CookieBasedPolicy" ]
                    } ],
                    "HealthCheck" : {
                      "Target" : "HTTP:80/",
                      "HealthyThreshold" : "2",
                      "UnhealthyThreshold" : "5",
                      "Interval" : "10",
                      "Timeout" : "5"
                    }
                  }
                },

                "WebServerGroup" : {
                  "Type" : "AWS::AutoScaling::AutoScalingGroup",
                  "Properties" : {
                    "AvailabilityZones" : { "Fn::GetAZs" : "" },
                    "LaunchConfigurationName" : { "Ref" : "LaunchConfig" },
                    "MinSize" : "1",
                    "MaxSize" : "5",
                    "DesiredCapacity" : { "Ref" : "WebServerCapacity" },
                    "LoadBalancerNames" : [ { "Ref" : "ElasticLoadBalancer" } ]
                  },
                  "CreationPolicy" : {
                    "ResourceSignal" : {
                      "Timeout" : "PT5M",
                      "Count"   : { "Ref" : "WebServerCapacity" }
                    }
                  },
                  "UpdatePolicy": {
                    "AutoScalingRollingUpdate": {
                      "MinInstancesInService": "1",
                      "MaxBatchSize": "1",
                      "PauseTime" : "PT15M",
                      "WaitOnResourceSignals": "true"
                    }
                  }
                },

                "LaunchConfig": {
                  "Type" : "AWS::AutoScaling::LaunchConfiguration",
                  "Metadata" : {
                    "Comment1" : "Configure the bootstrap helpers to install the Apache Web Server and PHP",
                    "Comment2" : "The website content is downloaded from the CloudFormationPHPSample.zip file",

                    "AWS::CloudFormation::Init" : {
                      "config" : {
                        "packages" : {
                          "yum" : {
                            "httpd"     : [],
                            "php"       : [],
                            "php-mysql" : []
                          }
                        },

                        "files" : {
                          "/var/www/html/index.php" : {
                            "content" : { "Fn::Join" : [ "", [
                              "<html>\\n",
                              "  <head>\\n",
                              "    <title>AWS CloudFormation PHP Sample</title>\\n",
                              "    <meta http-equiv=\\"Content-Type\\" content=\\"text/html; charset=ISO-8859-1\\">\\n",
                              "  </head>\\n",
                              "  <body>\\n",
                              "    <h1>Welcome to the AWS CloudFormation PHP Sample</h1>\\n",
                              "    <p/>\\n",
                              "    <?php\\n",
                              "      // Print out the current data and tie\\n",
                              "      print \\"The Current Date and Time is: <br/>\\";\\n",
                              "      print date(\\"g:i A l, F j Y.\\");\\n",
                              "    ?>\\n",
                              "    <p/>\\n",
                              "    <?php\\n",
                              "      // Setup a handle for CURL\\n",
                              "      $curl_handle=curl_init();\\n",
                              "      curl_setopt($curl_handle,CURLOPT_CONNECTTIMEOUT,2);\\n",
                              "      curl_setopt($curl_handle,CURLOPT_RETURNTRANSFER,1);\\n",
                              "      // Get the hostname of the intance from the instance metadata\\n",
                              "      curl_setopt($curl_handle,CURLOPT_URL,'http://169.254.169.254/latest/meta-data/public-hostname');\\n",
                              "      $hostname = curl_exec($curl_handle);\\n",
                              "      if (empty($hostname))\\n",
                              "      {\\n",
                              "        print \\"Sorry, for some reason, we got no hostname back <br />\\";\\n",
                              "      }\\n",
                              "      else\\n",
                              "      {\\n",
                              "        print \\"Server = \\" . $hostname . \\"<br />\\";\\n",
                              "      }\\n",
                              "      // Get the instance-id of the intance from the instance metadata\\n",
                              "      curl_setopt($curl_handle,CURLOPT_URL,'http://169.254.169.254/latest/meta-data/instance-id');\\n",
                              "      $instanceid = curl_exec($curl_handle);\\n",
                              "      if (empty($instanceid))\\n",
                              "      {\\n",
                              "        print \\"Sorry, for some reason, we got no instance id back <br />\\";\\n",
                              "      }\\n",
                              "      else\\n",
                              "      {\\n",
                              "        print \\"EC2 instance-id = \\" . $instanceid . \\"<br />\\";\\n",
                              "      }\\n",
                              "      $Database   = \\"", {"Fn::GetAtt" : ["MySQLDatabase", "Endpoint.Address"]}, "\\";\\n",
                              "      $DBUser     = \\"", {"Ref" : "DBUser"}, "\\";\\n",
                              "      $DBPassword = \\"", {"Ref" : "DBPassword"}, "\\";\\n",
                              "      print \\"Database = \\" . $Database . \\"<br />\\";\\n",
                              "      $dbconnection = mysql_connect($Database, $DBUser, $DBPassword)\\n",
                              "                      or die(\\"Could not connect: \\" . mysql_error());\\n",
                              "      print (\\"Connected to $Database successfully\\");\\n",
                              "      mysql_close($dbconnection);\\n",
                              "    ?>\\n",
                              "    <h2>PHP Information</h2>\\n",
                              "    <p/>\\n",
                              "    <?php\\n",
                              "      phpinfo();\\n",
                              "    ?>\\n",
                              "  </body>\\n",
                              "</html>\\n"
                            ]]},
                            "mode"  : "000600",
                            "owner" : "apache",
                            "group" : "apache"
                          },
                          "/etc/cfn/cfn-hup.conf" : {
                            "content" : { "Fn::Join" : ["", [
                              "[main]\\n",
                              "stack=", { "Ref" : "AWS::StackId" }, "\\n",
                              "region=", { "Ref" : "AWS::Region" }, "\\n"
                            ]]},
                            "mode"    : "000400",
                            "owner"   : "root",
                            "group"   : "root"
                          },

                          "/etc/cfn/hooks.d/cfn-auto-reloader.conf" : {
                            "content": { "Fn::Join" : ["", [
                              "[cfn-auto-reloader-hook]\\n",
                              "triggers=post.update\\n",
                              "path=Resources.LaunchConfig.Metadata.AWS::CloudFormation::Init\\n",
                              "action=/opt/aws/bin/cfn-init -v ",
                              "         --stack ", { "Ref" : "AWS::StackName" },
                              "         --resource LaunchConfig ",
                              "         --region ", { "Ref" : "AWS::Region" }, "\\n",
                              "runas=root\\n"
                            ]]}
                          }
                        },

                        "services" : {
                          "sysvinit" : {
                            "httpd" : { "enabled" : "true", "ensureRunning" : "true" },
                            "cfn-hup" : { "enabled" : "true", "ensureRunning" : "true",
                                          "files" : ["/etc/cfn/cfn-hup.conf", "/etc/cfn/hooks.d/cfn-auto-reloader.conf"]}
                          }
                        }
                      }
                    }
                  },
                  "Properties": {
                    "ImageId" : { "Fn::FindInMap" : [ "AWSRegionArch2AMI", { "Ref" : "AWS::Region" },
                                      { "Fn::FindInMap" : [ "AWSInstanceType2Arch", { "Ref" : "InstanceType" }, "Arch" ] } ] },
                    "InstanceType" : { "Ref" : "InstanceType" },
                    "SecurityGroups" : [ {"Ref" : "WebServerSecurityGroup"} ],
                    "KeyName" : { "Ref" : "KeyName" },
                    "UserData" : { "Fn::Base64" : { "Fn::Join" : ["", [
                         "#!/bin/bash -xe\\n",
                         "yum update -y aws-cfn-bootstrap\\n",

                         "# Install the files and packages from the metadata\\n",
                         "/opt/aws/bin/cfn-init -v ",
                         "         --stack ", { "Ref" : "AWS::StackName" },
                         "         --resource LaunchConfig ",
                         "         --region ", { "Ref" : "AWS::Region" }, "\\n",

                         "# Signal the status from cfn-init\\n",
                         "/opt/aws/bin/cfn-signal -e $? ",
                         "         --stack ", { "Ref" : "AWS::StackName" },
                         "         --resource WebServerGroup ",
                         "         --region ", { "Ref" : "AWS::Region" }, "\\n"
                    ]]}}
                  }
                },

                "WebServerSecurityGroup" : {
                  "Type" : "AWS::EC2::SecurityGroup",
                  "Properties" : {
                    "GroupDescription" : "Enable HTTP access via port 80 locked down to the ELB and SSH access",
                    "SecurityGroupIngress" : [
                      {"IpProtocol" : "tcp", "FromPort" : "80", "ToPort" : "80", "SourceSecurityGroupOwnerId" : {"Fn::GetAtt" : ["ElasticLoadBalancer", "SourceSecurityGroup.OwnerAlias"]},"SourceSecurityGroupName" : {"Fn::GetAtt" : ["ElasticLoadBalancer", "SourceSecurityGroup.GroupName"]}},
                      {"IpProtocol" : "tcp", "FromPort" : "22", "ToPort" : "22", "CidrIp" : { "Ref" : "SSHLocation"}}
                    ]
                  }
                },

                "DBEC2SecurityGroup": {
                  "Type": "AWS::EC2::SecurityGroup",
                  "Condition" : "Is-EC2-VPC",
                  "Properties" : {
                    "GroupDescription": "Open database for access",
                    "SecurityGroupIngress" : [{
                      "IpProtocol" : "tcp",
                      "FromPort" : "3306", 
                      "ToPort" : "3306",
                      "SourceSecurityGroupName" : { "Ref" : "WebServerSecurityGroup" }
                    }]
                  }
                },

                "DBSecurityGroup": {
                  "Type": "AWS::RDS::DBSecurityGroup",
                  "Condition" : "Is-EC2-Classic",
                  "Properties": {
                    "DBSecurityGroupIngress": {
                      "EC2SecurityGroupName": { "Ref": "WebServerSecurityGroup" }
                    },
                    "GroupDescription": "database access"
                  }
                },

                "MySQLDatabase": {
                  "Type": "AWS::RDS::DBInstance",
                  "Properties": {
                    "Engine" : "MySQL",
                    "DBName" : { "Ref": "DBName" },
                    "MultiAZ" : { "Ref": "MultiAZDatabase" },
                    "MasterUsername": { "Ref": "DBUser" },
                    "MasterUserPassword": { "Ref" : "DBPassword" },
                    "DBInstanceClass": { "Ref" : "DBInstanceClass" },
                    "AllocatedStorage": { "Ref" : "DBAllocatedStorage" },
                    "VPCSecurityGroups": { "Fn::If" : [ "Is-EC2-VPC", [ { "Fn::GetAtt": [ "DBEC2SecurityGroup", "GroupId" ] } ], { "Ref" : "AWS::NoValue"}]},
                    "DBSecurityGroups": { "Fn::If" : [ "Is-EC2-Classic", [ { "Ref": "DBSecurityGroup" } ], { "Ref" : "AWS::NoValue"}]}
                  }
                }
              },

              "Outputs" : {
                "WebsiteURL" : {
                  "Description" : "URL for newly created LAMP stack",
                  "Value" : { "Fn::Join" : ["", ["http://", { "Fn::GetAtt" : [ "ElasticLoadBalancer", "DNSName" ]}]] }
                }
              }
            }
        """
        parsed = json.loads(template)
        items = StackWizardView.identify_aws_template(parsed, modify=False)
        # verify items identified
        self.assertTrue(len(items) > 0)
        items = StackWizardView.identify_aws_template(parsed, modify=True)
        # verify items identified, but remove them
        self.assertTrue(len(items) > 0)
        items = StackWizardView.identify_aws_template(parsed, modify=False)
        # verify no more items
        self.assertTrue(len(items) == 0)
