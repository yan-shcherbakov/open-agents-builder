CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`billingAddress` text,
	`shippingAddress` text,
	`attributes` text,
	`notes` text,
	`statusChanges` text,
	`customer` text,
	`status` text,
	`email` text,
	`subtotal` text,
	`subTotalInclTax` text,
	`subtotalTaxValue` text,
	`total` text,
	`totalInclTax` text,
	`shippingPrice` text,
	`shippingPriceInclTax` text,
	`items` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
