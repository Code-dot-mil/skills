"""Add the operator's extra CA file to public roots for the assessment job."""

import os
import ssl
import sys
from pathlib import Path

import certifi

# Use the TLS library to load certificates; keep its verification enabled.
# certifi is provided by the example image's SkillSpector installation.
context = ssl.create_default_context()
context.load_verify_locations(cafile=certifi.where())
context.load_verify_locations(cafile=os.environ["ASSESSMENT_CA_CERTIFICATES"])
with Path(sys.argv[1]).open("x", encoding="ascii") as output:
    output.write("".join(ssl.DER_cert_to_PEM_cert(cert) for cert in context.get_ca_certs(binary_form=True)))
print("Assessment runtime CA bundle created.")
