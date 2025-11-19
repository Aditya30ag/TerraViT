import kagglehub

# Download latest version
path = kagglehub.dataset_download("immulu/bigearthnetv2-s2-4")

print("Path to dataset files:", path)