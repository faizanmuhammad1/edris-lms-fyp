// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LMSCertificate {
    address public owner;

    struct CertRecord {
        bytes32 payloadHash;
        uint64  issuedAt;
        address issuer;
        bool    exists;
    }

    mapping(bytes32 => CertRecord) private _certs;

    event CertificateIssued(
        string  certificateId,
        bytes32 indexed certIdHash,
        bytes32 payloadHash,
        address indexed issuer,
        uint64  issuedAt
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }

    function issueCertificate(
        string  calldata certificateId,
        bytes32 payloadHash
    ) external onlyOwner {
        bytes32 idHash = keccak256(bytes(certificateId));
        require(!_certs[idHash].exists, "Already issued");
        require(payloadHash != bytes32(0), "Invalid hash");

        _certs[idHash] = CertRecord({
            payloadHash: payloadHash,
            issuedAt:    uint64(block.timestamp),
            issuer:      msg.sender,
            exists:      true
        });

        emit CertificateIssued(
            certificateId,
            idHash,
            payloadHash,
            msg.sender,
            uint64(block.timestamp)
        );
    }

    function verifyCertificate(
        string  calldata certificateId,
        bytes32 payloadHash
    ) external view returns (
        bool    isValid,
        bytes32 storedHash,
        uint64  issuedAt,
        address issuer
    ) {
        bytes32 idHash = keccak256(bytes(certificateId));
        CertRecord memory r = _certs[idHash];
        if (!r.exists) return (false, bytes32(0), 0, address(0));
        return (r.payloadHash == payloadHash, r.payloadHash, r.issuedAt, r.issuer);
    }

    function isIssued(string calldata certificateId) external view returns (bool) {
        return _certs[keccak256(bytes(certificateId))].exists;
    }
}

