-- Country Packs Schema
-- This adds country-based content management for iProf Tutor

-- ============================================
-- 1. CREATE COUNTRY PACKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.country_packs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,  -- e.g., 'US', 'PK', 'GB'
    name text NOT NULL,         -- e.g., 'United States', 'Pakistan'
    flag text,                  -- Emoji flag
    currency text DEFAULT 'USD',
    is_active boolean DEFAULT true,
    settings jsonb DEFAULT '{}'::jsonb, -- Country-specific settings
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT country_packs_pkey PRIMARY KEY (id)
);

-- Insert default countries
INSERT INTO public.country_packs (code, name, flag, currency) VALUES
    ('AF', 'Afghanistan', '🇦🇫', 'AFN'),
    ('AL', 'Albania', '🇦🇱', 'ALL'),
    ('DZ', 'Algeria', '🇩🇿', 'DZD'),
    ('AD', 'Andorra', '🇦🇩', 'EUR'),
    ('AO', 'Angola', '🇦🇴', 'AOA'),
    ('AG', 'Antigua and Barbuda', '🇦🇬', 'XCD'),
    ('AR', 'Argentina', '🇦🇷', 'ARS'),
    ('AM', 'Armenia', '🇦🇲', 'AMD'),
    ('AU', 'Australia', '🇦🇺', 'AUD'),
    ('AT', 'Austria', '🇦🇹', 'EUR'),
    ('AZ', 'Azerbaijan', '🇦🇿', 'AZN'),
    ('BS', 'Bahamas', '🇧🇸', 'BSD'),
    ('BH', 'Bahrain', '🇧🇭', 'BHD'),
    ('BD', 'Bangladesh', '🇧🇩', 'BDT'),
    ('BB', 'Barbados', '🇧🇧', 'BBD'),
    ('BY', 'Belarus', '🇧🇾', 'BYN'),
    ('BE', 'Belgium', '🇧🇪', 'EUR'),
    ('BZ', 'Belize', '🇧🇿', 'BZD'),
    ('BJ', 'Benin', '🇧🇯', 'XOF'),
    ('BT', 'Bhutan', '🇧🇹', 'BTN'),
    ('BO', 'Bolivia', '🇧🇴', 'BOB'),
    ('BA', 'Bosnia and Herzegovina', '🇧🇦', 'BAM'),
    ('BW', 'Botswana', '🇧🇼', 'BWP'),
    ('BR', 'Brazil', '🇧🇷', 'BRL'),
    ('BN', 'Brunei', '🇧🇳', 'BND'),
    ('BG', 'Bulgaria', '🇧🇬', 'BGN'),
    ('BF', 'Burkina Faso', '🇧🇫', 'XOF'),
    ('BI', 'Burundi', '🇧🇮', 'BIF'),
    ('CV', 'Cabo Verde', '🇨🇻', 'CVE'),
    ('KH', 'Cambodia', '🇰🇭', 'KHR'),
    ('CM', 'Cameroon', '🇨🇲', 'XAF'),
    ('CA', 'Canada', '🇨🇦', 'CAD'),
    ('CF', 'Central African Republic', '🇨🇫', 'XAF'),
    ('TD', 'Chad', '🇹🇩', 'XAF'),
    ('CL', 'Chile', '🇨🇱', 'CLP'),
    ('CN', 'China', '🇨🇳', 'CNY'),
    ('CO', 'Colombia', '🇨🇴', 'COP'),
    ('KM', 'Comoros', '🇰🇲', 'KMF'),
    ('CG', 'Congo', '🇨🇬', 'XAF'),
    ('CR', 'Costa Rica', '🇨🇷', 'CRC'),
    ('HR', 'Croatia', '🇭🇷', 'EUR'),
    ('CU', 'Cuba', '🇨🇺', 'CUP'),
    ('CY', 'Cyprus', '🇨🇾', 'EUR'),
    ('CZ', 'Czech Republic', '🇨🇿', 'CZK'),
    ('DK', 'Denmark', '🇩🇰', 'DKK'),
    ('DJ', 'Djibouti', '🇩🇯', 'DJF'),
    ('DM', 'Dominica', '🇩🇲', 'XCD'),
    ('DO', 'Dominican Republic', '🇩🇴', 'DOP'),
    ('EC', 'Ecuador', '🇪🇨', 'USD'),
    ('EG', 'Egypt', '🇪🇬', 'EGP'),
    ('SV', 'El Salvador', '🇸🇻', 'USD'),
    ('GQ', 'Equatorial Guinea', '🇬🇶', 'XAF'),
    ('ER', 'Eritrea', '🇪🇷', 'ERN'),
    ('EE', 'Estonia', '🇪🇪', 'EUR'),
    ('SZ', 'Eswatini', '🇸🇿', 'SZL'),
    ('ET', 'Ethiopia', '🇪🇹', 'ETB'),
    ('FJ', 'Fiji', '🇫🇯', 'FJD'),
    ('FI', 'Finland', '🇫🇮', 'EUR'),
    ('FR', 'France', '🇫🇷', 'EUR'),
    ('GA', 'Gabon', '🇬🇦', 'XAF'),
    ('GM', 'Gambia', '🇬🇲', 'GMD'),
    ('GE', 'Georgia', '🇬🇪', 'GEL'),
    ('DE', 'Germany', '🇩🇪', 'EUR'),
    ('GH', 'Ghana', '🇬🇭', 'GHS'),
    ('GR', 'Greece', '🇬🇷', 'EUR'),
    ('GD', 'Grenada', '🇬🇩', 'XCD'),
    ('GT', 'Guatemala', '🇬🇹', 'GTQ'),
    ('GN', 'Guinea', '🇬🇳', 'GNF'),
    ('GW', 'Guinea-Bissau', '🇬🇼', 'XOF'),
    ('GY', 'Guyana', '🇬🇾', 'GYD'),
    ('HT', 'Haiti', '🇭🇹', 'HTG'),
    ('HN', 'Honduras', '🇭🇳', 'HNL'),
    ('HU', 'Hungary', '🇭🇺', 'HUF'),
    ('IS', 'Iceland', '🇮🇸', 'ISK'),
    ('IN', 'India', '🇮🇳', 'INR'),
    ('ID', 'Indonesia', '🇮🇩', 'IDR'),
    ('IR', 'Iran', '🇮🇷', 'IRR'),
    ('IQ', 'Iraq', '🇮🇶', 'IQD'),
    ('IE', 'Ireland', '🇮🇪', 'EUR'),
    ('IL', 'Israel', '🇮🇱', 'ILS'),
    ('IT', 'Italy', '🇮🇹', 'EUR'),
    ('JM', 'Jamaica', '🇯🇲', 'JMD'),
    ('JP', 'Japan', '🇯🇵', 'JPY'),
    ('JO', 'Jordan', '🇯🇴', 'JOD'),
    ('KZ', 'Kazakhstan', '🇰🇿', 'KZT'),
    ('KE', 'Kenya', '🇰🇪', 'KES'),
    ('KI', 'Kiribati', '🇰🇮', 'AUD'),
    ('KP', 'North Korea', '🇰🇵', 'KPW'),
    ('KR', 'South Korea', '🇰🇷', 'KRW'),
    ('KW', 'Kuwait', '🇰🇼', 'KWD'),
    ('KG', 'Kyrgyzstan', '🇰🇬', 'KGS'),
    ('LA', 'Laos', '🇱🇦', 'LAK'),
    ('LV', 'Latvia', '🇱🇻', 'EUR'),
    ('LB', 'Lebanon', '🇱🇧', 'LBP'),
    ('LS', 'Lesotho', '🇱🇸', 'LSL'),
    ('LR', 'Liberia', '🇱🇷', 'LRD'),
    ('LY', 'Libya', '🇱🇾', 'LYD'),
    ('LI', 'Liechtenstein', '🇱🇮', 'CHF'),
    ('LT', 'Lithuania', '🇱🇹', 'EUR'),
    ('LU', 'Luxembourg', '🇱🇺', 'EUR'),
    ('MG', 'Madagascar', '🇲🇬', 'MGA'),
    ('MW', 'Malawi', '🇲🇼', 'MWK'),
    ('MY', 'Malaysia', '🇲🇾', 'MYR'),
    ('MV', 'Maldives', '🇲🇻', 'MVR'),
    ('ML', 'Mali', '🇲🇱', 'XOF'),
    ('MT', 'Malta', '🇲🇹', 'EUR'),
    ('MH', 'Marshall Islands', '🇲🇭', 'USD'),
    ('MR', 'Mauritania', '🇲🇷', 'MRU'),
    ('MU', 'Mauritius', '🇲🇺', 'MUR'),
    ('MX', 'Mexico', '🇲🇽', 'MXN'),
    ('FM', 'Micronesia', '🇫🇲', 'USD'),
    ('MD', 'Moldova', '🇲🇩', 'MDL'),
    ('MC', 'Monaco', '🇲🇨', 'EUR'),
    ('MN', 'Mongolia', '🇲🇳', 'MNT'),
    ('ME', 'Montenegro', '🇲🇪', 'EUR'),
    ('MA', 'Morocco', '🇲🇦', 'MAD'),
    ('MZ', 'Mozambique', '🇲🇿', 'MZN'),
    ('MM', 'Myanmar', '🇲🇲', 'MMK'),
    ('NA', 'Namibia', '🇳🇦', 'NAD'),
    ('NR', 'Nauru', '🇳🇷', 'AUD'),
    ('NP', 'Nepal', '🇳🇵', 'NPR'),
    ('NL', 'Netherlands', '🇳🇱', 'EUR'),
    ('NZ', 'New Zealand', '🇳🇿', 'NZD'),
    ('NI', 'Nicaragua', '🇳🇮', 'NIO'),
    ('NE', 'Niger', '🇳🇪', 'XOF'),
    ('NG', 'Nigeria', '🇳🇬', 'NGN'),
    ('MK', 'North Macedonia', '🇲🇰', 'MKD'),
    ('NO', 'Norway', '🇳🇴', 'NOK'),
    ('OM', 'Oman', '🇴🇲', 'OMR'),
    ('PK', 'Pakistan', '🇵🇰', 'PKR'),
    ('PW', 'Palau', '🇵🇼', 'USD'),
    ('PS', 'Palestine', '🇵🇸', 'ILS'),
    ('PA', 'Panama', '🇵🇦', 'PAB'),
    ('PG', 'Papua New Guinea', '🇵🇬', 'PGK'),
    ('PY', 'Paraguay', '🇵🇾', 'PYG'),
    ('PE', 'Peru', '🇵🇪', 'PEN'),
    ('PH', 'Philippines', '🇵🇭', 'PHP'),
    ('PL', 'Poland', '🇵🇱', 'PLN'),
    ('PT', 'Portugal', '🇵🇹', 'EUR'),
    ('QA', 'Qatar', '🇶🇦', 'QAR'),
    ('RO', 'Romania', '🇷🇴', 'RON'),
    ('RU', 'Russia', '🇷🇺', 'RUB'),
    ('RW', 'Rwanda', '🇷🇼', 'RWF'),
    ('KN', 'Saint Kitts and Nevis', '🇰🇳', 'XCD'),
    ('LC', 'Saint Lucia', '🇱🇨', 'XCD'),
    ('VC', 'Saint Vincent and the Grenadines', '🇻🇨', 'XCD'),
    ('WS', 'Samoa', '🇼🇸', 'WST'),
    ('SM', 'San Marino', '🇸🇲', 'EUR'),
    ('ST', 'Sao Tome and Principe', '🇸🇹', 'STN'),
    ('SA', 'Saudi Arabia', '🇸🇦', 'SAR'),
    ('SN', 'Senegal', '🇸🇳', 'XOF'),
    ('RS', 'Serbia', '🇷🇸', 'RSD'),
    ('SC', 'Seychelles', '🇸🇨', 'SCR'),
    ('SL', 'Sierra Leone', '🇸🇱', 'SLL'),
    ('SG', 'Singapore', '🇸🇬', 'SGD'),
    ('SK', 'Slovakia', '🇸🇰', 'EUR'),
    ('SI', 'Slovenia', '🇸🇮', 'EUR'),
    ('SB', 'Solomon Islands', '🇸🇧', 'SBD'),
    ('SO', 'Somalia', '🇸🇴', 'SOS'),
    ('ZA', 'South Africa', '🇿🇦', 'ZAR'),
    ('SS', 'South Sudan', '🇸🇸', 'SSP'),
    ('ES', 'Spain', '🇪🇸', 'EUR'),
    ('LK', 'Sri Lanka', '🇱🇰', 'LKR'),
    ('SD', 'Sudan', '🇸🇩', 'SDG'),
    ('SR', 'Suriname', '🇸🇷', 'SRD'),
    ('SE', 'Sweden', '🇸🇪', 'SEK'),
    ('CH', 'Switzerland', '🇨🇭', 'CHF'),
    ('SY', 'Syria', '🇸🇾', 'SYP'),
    ('TW', 'Taiwan', '🇹🇼', 'TWD'),
    ('TJ', 'Tajikistan', '🇹🇯', 'TJS'),
    ('TZ', 'Tanzania', '🇹🇿', 'TZS'),
    ('TH', 'Thailand', '🇹🇭', 'THB'),
    ('TL', 'Timor-Leste', '🇹🇱', 'USD'),
    ('TG', 'Togo', '🇹🇬', 'XOF'),
    ('TO', 'Tonga', '🇹🇴', 'TOP'),
    ('TT', 'Trinidad and Tobago', '🇹🇹', 'TTD'),
    ('TN', 'Tunisia', '🇹🇳', 'TND'),
    ('TR', 'Turkey', '🇹🇷', 'TRY'),
    ('TM', 'Turkmenistan', '🇹🇲', 'TMT'),
    ('TV', 'Tuvalu', '🇹🇻', 'AUD'),
    ('UG', 'Uganda', '🇺🇬', 'UGX'),
    ('UA', 'Ukraine', '🇺🇦', 'UAH'),
    ('AE', 'United Arab Emirates', '🇦🇪', 'AED'),
    ('GB', 'United Kingdom', '🇬🇧', 'GBP'),
    ('US', 'United States', '🇺🇸', 'USD'),
    ('UY', 'Uruguay', '🇺🇾', 'UYU'),
    ('UZ', 'Uzbekistan', '🇺🇿', 'UZS'),
    ('VU', 'Vanuatu', '🇻🇺', 'VUV'),
    ('VA', 'Vatican City', '🇻🇦', 'EUR'),
    ('VE', 'Venezuela', '🇻🇪', 'VES'),
    ('VN', 'Vietnam', '🇻🇳', 'VND'),
    ('YE', 'Yemen', '🇾🇪', 'YER'),
    ('ZM', 'Zambia', '🇿🇲', 'ZMW'),
    ('ZW', 'Zimbabwe', '🇿🇼', 'ZWL')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 2. ADD COUNTRY_CODE TO PROFILES
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country_code text REFERENCES public.country_packs(code),
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS parent_email text,
ADD COLUMN IF NOT EXISTS parent_confirmed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp with time zone;

-- ============================================
-- 3. ADD COUNTRY_CODE TO CONTENT TABLE
-- ============================================
ALTER TABLE public.content
ADD COLUMN IF NOT EXISTS country_code text REFERENCES public.country_packs(code);

-- ============================================
-- 4. ADD COUNTRY_CODE TO PRACTICE_TOPICS
-- ============================================
ALTER TABLE public.practice_topics
ADD COLUMN IF NOT EXISTS country_code text REFERENCES public.country_packs(code);

-- ============================================
-- 5. ADD COUNTRY_CODE TO PRACTICE_QUESTIONS
-- ============================================
ALTER TABLE public.practice_questions
ADD COLUMN IF NOT EXISTS country_code text REFERENCES public.country_packs(code);

-- ============================================
-- 6. ADD COUNTRY_CODE TO FLASHCARDS
-- ============================================
ALTER TABLE public.flashcards
ADD COLUMN IF NOT EXISTS country_code text REFERENCES public.country_packs(code);

-- ============================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_country_code ON public.profiles(country_code);
CREATE INDEX IF NOT EXISTS idx_content_country_code ON public.content(country_code);
CREATE INDEX IF NOT EXISTS idx_practice_topics_country_code ON public.practice_topics(country_code);
CREATE INDEX IF NOT EXISTS idx_practice_questions_country_code ON public.practice_questions(country_code);
CREATE INDEX IF NOT EXISTS idx_flashcards_country_code ON public.flashcards(country_code);

-- ============================================
-- 8. CREATE FUNCTION TO GET COUNTRY NAME FROM PROFILE METADATA
-- ============================================
-- This helps migrate existing users who have country in metadata
CREATE OR REPLACE FUNCTION public.get_country_code_from_name(country_name text)
RETURNS text AS $$
BEGIN
    RETURN CASE 
        WHEN country_name = 'United States' THEN 'US'
        WHEN country_name = 'Canada' THEN 'CA'
        WHEN country_name = 'United Kingdom' THEN 'GB'
        WHEN country_name = 'Australia' THEN 'AU'
        WHEN country_name = 'India' THEN 'IN'
        WHEN country_name = 'Singapore' THEN 'SG'
        WHEN country_name = 'New Zealand' THEN 'NZ'
        WHEN country_name = 'Ireland' THEN 'IE'
        WHEN country_name = 'South Africa' THEN 'ZA'
        WHEN country_name = 'Pakistan' THEN 'PK'
        WHEN country_name = 'Bangladesh' THEN 'BD'
        WHEN country_name = 'United Arab Emirates' THEN 'AE'
        ELSE 'OTHER'
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. MIGRATE EXISTING PROFILES (if metadata has country)
-- ============================================
-- This updates profiles that have country in metadata but not in country_code
UPDATE public.profiles 
SET 
    country_code = public.get_country_code_from_name(metadata->>'country'),
    grade_level = COALESCE(grade_level, metadata->>'grade'),
    age = (metadata->>'age')::integer,
    parent_email = metadata->>'parent_email',
    parent_confirmed = COALESCE((metadata->>'parent_confirmed')::boolean, false),
    onboarding_completed_at = (metadata->>'completed_at')::timestamp with time zone
WHERE metadata IS NOT NULL 
  AND metadata->>'country' IS NOT NULL
  AND country_code IS NULL;

-- ============================================
-- 10. CREATE VIEW FOR COUNTRY STATISTICS (Admin)
-- ============================================
CREATE OR REPLACE VIEW public.country_stats AS
SELECT 
    cp.code,
    cp.name,
    cp.flag,
    cp.is_active,
    COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'student') as student_count,
    COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'teacher') as teacher_count,
    COUNT(DISTINCT c.id) as content_count,
    COUNT(DISTINCT pt.id) as topic_count,
    COUNT(DISTINCT pq.id) as question_count,
    COUNT(DISTINCT f.id) as flashcard_count
FROM public.country_packs cp
LEFT JOIN public.profiles p ON p.country_code = cp.code
LEFT JOIN public.content c ON c.country_code = cp.code
LEFT JOIN public.practice_topics pt ON pt.country_code = cp.code
LEFT JOIN public.practice_questions pq ON pq.country_code = cp.code
LEFT JOIN public.flashcards f ON f.country_code = cp.code
GROUP BY cp.code, cp.name, cp.flag, cp.is_active;

-- ============================================
-- 11. RLS POLICIES FOR COUNTRY_PACKS
-- ============================================
ALTER TABLE public.country_packs ENABLE ROW LEVEL SECURITY;

-- Everyone can view active country packs
CREATE POLICY "Country packs are viewable by everyone"
ON public.country_packs FOR SELECT
USING (true);

-- Only admins can modify country packs
CREATE POLICY "Only admins can insert country packs"
ON public.country_packs FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Only admins can update country packs"
ON public.country_packs FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Only admins can delete country packs"
ON public.country_packs FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
