// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title ReceiptRegistry — On-chain AP2 payment receipt storage
/// @notice Stores hashed receipts for the complete AP2 mandate chain
/// @dev Deployed on SKALE Base Sepolia (Chain ID: 324705682)
contract ReceiptRegistry {
    struct OnChainReceipt {
        bytes32 receiptHash;
        bytes32 intentHash;
        bytes32 cartHash;
        bytes32 paymentHash;
        address payer;
        address merchant;
        uint256 amount;
        uint256 timestamp;
    }

    uint256 public receiptCount;
    mapping(uint256 => OnChainReceipt) public receipts;
    mapping(bytes32 => uint256) public receiptByHash;

    event ReceiptRecorded(
        uint256 indexed id,
        bytes32 receiptHash,
        address payer,
        address merchant,
        uint256 amount
    );

    /// @notice Record a new payment receipt on-chain
    /// @param receiptHash keccak256 hash of the full receipt JSON
    /// @param intentHash Hash of the IntentMandate
    /// @param cartHash Hash of the CartMandate
    /// @param paymentHash Hash of the PaymentMandate
    /// @param merchant Address of the merchant
    /// @param amount Payment amount in smallest unit
    function recordReceipt(
        bytes32 receiptHash,
        bytes32 intentHash,
        bytes32 cartHash,
        bytes32 paymentHash,
        address merchant,
        uint256 amount
    ) external {
        require(receiptByHash[receiptHash] == 0, "Receipt already recorded");

        receiptCount++;
        receipts[receiptCount] = OnChainReceipt({
            receiptHash: receiptHash,
            intentHash: intentHash,
            cartHash: cartHash,
            paymentHash: paymentHash,
            payer: msg.sender,
            merchant: merchant,
            amount: amount,
            timestamp: block.timestamp
        });
        receiptByHash[receiptHash] = receiptCount;

        emit ReceiptRecorded(
            receiptCount,
            receiptHash,
            msg.sender,
            merchant,
            amount
        );
    }

    /// @notice Verify if a receipt exists on-chain
    /// @param receiptHash The receipt hash to verify
    /// @return exists Whether the receipt exists
    /// @return receipt The on-chain receipt data
    function verifyReceipt(
        bytes32 receiptHash
    ) external view returns (bool exists, OnChainReceipt memory receipt) {
        uint256 id = receiptByHash[receiptHash];
        if (id == 0) return (false, receipts[0]);
        return (true, receipts[id]);
    }

    /// @notice Get a receipt by its sequential ID
    /// @param id The receipt ID
    /// @return The on-chain receipt data
    function getReceipt(
        uint256 id
    ) external view returns (OnChainReceipt memory) {
        require(id > 0 && id <= receiptCount, "Invalid receipt ID");
        return receipts[id];
    }
}
