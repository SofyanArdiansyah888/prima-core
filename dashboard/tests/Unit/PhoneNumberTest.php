<?php

namespace Tests\Unit;

use Modules\Customer\Support\PhoneNumber as CustomerPhoneNumber;
use Modules\Shared\Support\PhoneNumber;
use PHPUnit\Framework\TestCase;

class PhoneNumberTest extends TestCase
{
    public function test_normalizes_to_local_format(): void
    {
        $this->assertSame('081234567890', PhoneNumber::toLocal('081234567890'));
        $this->assertSame('081234567890', PhoneNumber::toLocal('6281234567890'));
        $this->assertSame('081234567890', PhoneNumber::toLocal('+62 812-3456-7890'));
        $this->assertSame('081234567890', PhoneNumber::toLocal('81234567890'));
        $this->assertSame('', PhoneNumber::toLocal(''));
    }

    public function test_normalizes_to_international_format(): void
    {
        $this->assertSame('6281234567890', PhoneNumber::toInternational('081234567890'));
        $this->assertSame('6281234567890', PhoneNumber::toInternational('6281234567890'));
        $this->assertSame('6281234567890', PhoneNumber::toInternational('+62 812-3456-7890'));
        $this->assertSame('6281234567890', PhoneNumber::toInternational('81234567890'));
        $this->assertSame('', PhoneNumber::toInternational(''));
    }

    public function test_masks_phone_number_for_privacy(): void
    {
        $this->assertSame('0812****7890', PhoneNumber::mask('081234567890'));
        $this->assertSame('0812****6789', PhoneNumber::mask('628123456789'));
        $this->assertSame('01234', PhoneNumber::mask('1234'));
    }

    public function test_validates_indonesian_mobile_numbers(): void
    {
        $this->assertTrue(PhoneNumber::isMobile('081234567890'));
        $this->assertTrue(PhoneNumber::isMobile('+6281234567890'));
        $this->assertTrue(PhoneNumber::isMobile('6281234567890'));
        $this->assertTrue(PhoneNumber::isMobile('81234567890'));

        $this->assertFalse(PhoneNumber::isMobile('0217654321')); // Landline
        $this->assertFalse(PhoneNumber::isMobile('0812')); // Too short
        $this->assertFalse(PhoneNumber::isMobile('08123456789012345')); // Too long
        $this->assertFalse(PhoneNumber::isMobile('abc'));
    }

    public function test_customer_proxy_helper_matches_shared_behavior(): void
    {
        $this->assertSame('081234567890', CustomerPhoneNumber::normalize('+62 812-3456-7890'));
        $this->assertSame('6281234567890', CustomerPhoneNumber::toInternational('081234567890'));
        $this->assertSame('0812****7890', CustomerPhoneNumber::mask('081234567890'));
        $this->assertTrue(CustomerPhoneNumber::isMobile('081234567890'));
    }
}
