package kms

import (
	"context"
	"os"

	kmspb "cloud.google.com/go/kms/apiv1/kmspb"
	kms "cloud.google.com/go/kms/apiv1"
)

// WrapDEK encrypts a data-encryption key (DEK) using Cloud KMS.
// keyName should be a full resource name, e.g. projects/PROJECT/locations/REGION/keyRings/RING/cryptoKeys/KEY.
func WrapDEK(ctx context.Context, keyName string, dek []byte) ([]byte, error) {
	client, err := kms.NewKeyManagementClient(ctx)
	if err != nil {
		return nil, err
	}
	defer client.Close()

	if keyName == "" {
		keyName = os.Getenv("KMS_KEY_NAME")
	}

	resp, err := client.Encrypt(ctx, &kmspb.EncryptRequest{
		Name:      keyName,
		Plaintext: dek,
	})
	if err != nil {
		return nil, err
	}
	return resp.Ciphertext, nil
}

// UnwrapDEK decrypts a wrapped DEK using Cloud KMS.
func UnwrapDEK(ctx context.Context, keyName string, wrapped []byte) ([]byte, error) {
	client, err := kms.NewKeyManagementClient(ctx)
	if err != nil {
		return nil, err
	}
	defer client.Close()

	if keyName == "" {
		keyName = os.Getenv("KMS_KEY_NAME")
	}

	resp, err := client.Decrypt(ctx, &kmspb.DecryptRequest{
		Name:       keyName,
		Ciphertext: wrapped,
	})
	if err != nil {
		return nil, err
	}
	return resp.Plaintext, nil
}
