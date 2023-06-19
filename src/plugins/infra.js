module.exports = {
  deploy: {
    start: async ({ arc, cloudformation, dryRun, inventory, stage }) => {
      cloudformation.Resources.ServerEncryptionKey = {
        Type: 'AWS::KMS::Key',
        Properties: {
          Description:
            'Server-side encryption key for secret keys in the database',
          KeyPolicy: {
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: {
                    'Fn::Sub': ['arn:aws:iam::${AWS::AccountId}:root', {}],
                  },
                },
                Action: 'kms:*',
                Resource: '*',
              },
            ],
          },
        },
      };

      cloudformation.Resources.Role.Properties.Policies.push({
        PolicyName: 'ServerEncryptionKeyPolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:Encrypt'],
              Resource: {
                'Fn::Sub': [
                  'arn:aws:kms:${AWS::Region}:${AWS::AccountId}:key/${keyid}',
                  {
                    keyid: {
                      Ref: 'ServerEncryptionKey',
                    },
                  },
                ],
              },
            },
          ],
        },
      });

      for (const resource of Object.values(cloudformation.Resources)) {
        if (resource.Type === 'AWS::Serverless::Function') {
          resource.Properties.Environment.Variables = {
            ...resource.Properties.Environment.Variables,
            SERVER_ENCRYPTION_KEY: {
              'Fn::Sub': [
                'arn:aws:kms:${AWS::Region}:${AWS::AccountId}:key/${keyid}',
                {
                  keyid: {
                    Ref: 'ServerEncryptionKey',
                  },
                },
              ],
            },
          };
        }
      }

      return cloudformation;
    },
  },
};
