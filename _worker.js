// Util Functions
function escapeHtml(text) {
	return (text || '').replace(/[&<>"]'/g, m => ({
		'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
	})[m]);
}
function simpleEncode(domain, slug, length = 9) {
	const seed = `${domain}|${slug}`;
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash << 5) - hash + seed.charCodeAt(i);
		hash |= 0;
	}
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	let value = Math.abs(hash);
	while (result.length < length) {
		result += chars[value % chars.length];
		value = Math.floor(value / chars.length);
	}
	return result;
}
function detectLang(domain, slug, idSuffix) {
	const langs = ['ko', 'en', 'ja', 'fr', 'es', 'pt', 'it', 'th', 'ar', 'pl', 'de', 'nl', 'ru'];
	for (const lang of langs) {
		if (generateId(domain, lang, slug, 5) === idSuffix) return lang;
	}
	return null;
}
function generateId(domain, lang, slug, length = 5) {
	const seed = `${domain}|${lang}|${slug}`;
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash << 5) - hash + seed.charCodeAt(i);
		hash |= 0;
	}
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	let value = Math.abs(hash);
	while (result.length < length) {
		result += chars[value % chars.length];
		value = Math.floor(value / chars.length);
	}
	return result;
}
const generateProductHtml = (data, lang, url, affUrl, slug, outboundUrl = '') => {
	const title = escapeHtml(data.document_title || slug);
	const description = escapeHtml(data.newdescription || '');
	const productName = escapeHtml(data.titlesingle);
	const imageUrls = data.product_small_image_urls || [];
	const randomSlug = escapeHtml(data.slugAcak);
	const randomIdSuffix = generateId(url.hostname, lang, data.slugAcak, 5);
	const randomInternalUrl = `/${lang ? lang + '/' : ''}${randomSlug}-${randomIdSuffix}`;
	const randomSlugText = randomSlug.replace(/-/g, ' ');
	const priceFormatted = escapeHtml(data.target_sale_price_formatted);
	const firstCategoryRaw = data.first_level_category_name || '';
	const secondCategoryRaw = data.second_level_category_name || '';
	const firstCategory = escapeHtml(firstCategoryRaw);
	const secondCategory = escapeHtml(secondCategoryRaw);
	const firstSlug = firstCategoryRaw.trim().replace(/\s+/g, '-');
	const secondSlug = secondCategoryRaw.trim().replace(/\s+/g, '-');
	const categories = {
	  first_level_category_name: firstCategory,
	  second_level_category_name: secondCategory,
	  first_level_category_slug: firstSlug,
	  second_level_category_slug: secondSlug
	};
	const dir = data.dir || 'ltr';
	
	const buyButtonLabels = {
		en: 'Detail Product',
		ko: '제품 상세보기',
		ja: '商品詳細',
		de: 'Produktdetails',
		pl: 'Szczegóły produktu',
		th: 'ดูรายละเอียดสินค้า',
		es: 'Detalles del producto',
		pt: 'Detalhes do produto',
		ar: 'تفاصيل المنتج',
		it: 'Dettagli del prodotto',
		fr: 'Détails du produit',
		nl: 'Productdetails',
		ru: 'Детали продукта'
	};
	const buyLabel = buyButtonLabels[lang] || buyButtonLabels['en'];

	const relatedTitles = {
		    ko: '관련 상품',
		    fr: 'Produits Associés',
		    es: 'Productos Relacionados',
		    pt: 'Produtos Relacionados',
		    it: 'Prodotti Correlati',
		    ja: '関連商品',
		    en: 'Related Products',
		    pl: 'Produkty Powiązane',
		    de: 'Verwandte Produkte',
		    th: 'สินค้าที่เกี่ยวข้อง',
		    ar: 'منتجات ذات صلة',
		    nl: 'Gerelateerde Producten',
		    ru: 'Связанные товары'
		};
	const relatedTitle = relatedTitles[lang] || relatedTitles['en'];
	let extraOutboundLink = '';
	    if (outboundUrl) {
	        extraOutboundLink = `
	            <div class="related-link" style="margin-top:1px; display:block;">
	                <a href="${outboundUrl}" target="_blank" style="font-weight:bold; color:#555;">${relatedTitle}</a>
	            </div>`;
	    }
	
	const productJsonLd = {
		"@context": "https://schema.org/",
		"@type": "Product",
		name: data.titlesingle,
		image: imageUrls,
		description: data.newdescription,
		sku: data.productId,
		...(data.lastest_volume > 0 && {
			aggregateRating: {
				"@type": "AggregateRating",
				ratingValue: data.stars,
				reviewCount: data.lastest_volume,
			}
		}),
		offers: {
			"@type": "Offer",
			url: url.href,
			priceCurrency: data.target_currency,
			price: Number(data.target_sale_price),
			availability: "https://schema.org/InStock",
		}
	};

	
	return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="index,follow">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${imageUrls[0]}">
<meta property="og:url" content="${url.href}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="best.geeyyo.com">
<link rel="canonical" href="${url.origin}${url.pathname}${url.search}">
<link rel="icon" type="image/png" href="/favicon.ico"/>
<meta name="theme-color" content="#ffffff" />
<style>
body{font-family:Arial,sans-serif;background-color:#f1f1f1;margin:0;padding:20px;display:flex;justify-content:center}.product-wrapper{max-width:768px;margin:0 auto;padding:1rem;background:#fff;border-radius:12px;box-shadow:0 2px 10px rgb(0 0 0 / .05);box-sizing:border-box}.product-title{font-size:20px;text-align:center;margin-bottom:1rem;color:#111;padding:0 1rem;word-break:break-word}.product-gallery{width:100%;max-width:768px;margin:0 auto;padding:1rem;display:flex;flex-direction:column;align-items:center;background:#fff;border-radius:10px;box-shadow:0 2px 8px rgb(0 0 0 / .05);box-sizing:border-box}.main-image{width:100%;height:auto;border:1px solid #ccc;border-radius:8px;margin-bottom:16px;box-shadow:0 0 10px rgb(0 0 0 / .1)}.thumbnails{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-bottom:16px;max-width:100%}.thumb{width:72px;height:72px;object-fit:cover;border:2px solid #fff0;border-radius:6px;cursor:pointer;transition:border-color 0.3s,transform 0.2s}.thumb:hover{border-color:#007bff;transform:scale(1.05)}.description{padding:0 1rem;font-size:14px;text-align:center;line-height:1.6;color:#333}.buy-button{display:block;background-color:#c62828;color:#fff;font-weight:700;padding:12px 24px;margin:24px auto 0;border:none;border-radius:6px;text-decoration:none;font-size:16px;text-align:center;transition:background-color 0.3s ease;box-shadow:0 4px 10px rgb(0 0 0 / .1);max-width:300px}.buy-button:hover{background-color:#b71c1c}.related-link{text-align:center;font-size:14px;margin:20px auto 10px;padding:8px 12px;background-color:#fff;border-radius:6px;display:inline-block;box-shadow:0 1px 4px rgb(0 0 0 / .05)}.related-link a{color:#0056b3;text-decoration:none;font-weight:500}.related-link a:hover{text-decoration:underline}.breadcrumb{padding-left:12px;margin-top:8px;margin-bottom:8px;font-size:13px;color:#333}.breadcrumb a{color:#333;text-decoration:none}.breadcrumb a:hover{text-decoration:underline}.price-box{text-align:center;margin:16px 0 8px;font-family:'Arial',sans-serif}.price-label{font-size:20px;color:#222}.price-value{font-size:28px;font-weight:700;color:#222}@media (max-width:480px){.thumb{width:64px;height:64px}.product-gallery{padding:.5rem}.description{font-size:13px}.button-link{width:100%;text-align:center}}
</style>
<script type="application/ld+json">
${JSON.stringify(productJsonLd)}
</script>
<script id="category-json" type="application/json">${JSON.stringify(categories)}</script>
</head>
<body>
<div class="product-wrapper">
<nav id="breadcrumbBox" class="breadcrumb" aria-label="Breadcrumb"></nav>

<div class="product-gallery">
	<img
		 id="mainImage"
		 src="${imageUrls[0].replace('.jpg', '.jpg_324x324.jpg')}" 
		 srcset="${imageUrls[0].replace('.jpg', '.jpg_100x100.jpg')} 100w, ${imageUrls[0].replace('.jpg', '.jpg_324x324.jpg')} 324w, ${imageUrls[0].replace('.jpg', '.jpg_500x500.jpg')} 500w"
		 sizes="(max-width: 400px) 100vw, 324px"
		 alt="${productName}" 
		 class="main-image" 
		 fetchpriority="high"
		 width="324"
		 height="324"
		 style="max-width: 100%; height: auto;"
		 />


	<h1 class="product-title">${productName}</h1>

	<div class="thumbnails">
		${imageUrls.map((url, i) => {
		const base = url.replace('.jpg', ''); // tanpa .jpg dihapus total
		return `
		<img 
			 src="${url.replace('.jpg', '.jpg_100x100.jpg')}"
			 data-full="${url}"
			 data-srcset="${url.replace('.jpg', '.jpg_100x100.jpg')} 100w, ${url.replace('.jpg', '.jpg_324x324.jpg')} 324w, ${url.replace('.jpg', '.jpg_500x500.jpg')} 500w"
			 data-sizes="(max-width: 400px) 100vw, 324px"
			 alt="${productName} ${i + 1}" 
			 class="thumb ${i === 0 ? 'active' : ''}" 
			 loading="lazy"
			 onclick="const main=document.getElementById('mainImage');main.src=this.dataset.full.replace('.jpg','.jpg_324x324.jpg');main.srcset=this.dataset.srcset;main.sizes=this.dataset.sizes;document.querySelectorAll('.thumb').forEach(t=>t.classList.remove('active'));this.classList.add('active');"
			 />
		`;
		}).join('')}
	</div>
</div>

<div class="price-box">
	<span class="price-label"></span><span class="price-value">${priceFormatted.replace(/^US\s*/, '')}</span>
</div>
<p class="description" dir="${dir}">${description}</p>
${extraOutboundLink}
<div style="text-align:center;">
	<div class="related-link">
	<a href="${randomInternalUrl}">${randomSlugText}</a>
	</div>
</div>
<a href="#" class="buy-button" rel="nofollow noopener"
   onclick="window.location.href='${affUrl}'; return false;">
  ${buyLabel}
</a>
</div>

<div style="display:none;">
<img src="//sstatic1.histats.com/0.gif?4965433&101" alt="histats" width="1" height="1">
</div>

<script>
const _0x52ef99=_0x385f;function _0x4d09(){const _0x1b5b4a=['Populair','หน้าหลัก','Inicio','4387614wTpqBb','60faATML','ยอดนิยม','11810151DenYrm','1057372AqQjfZ','8264311ECdcOU','Popular','Populares','ホーム','HOME','Popularne','49RjVKIs','Home','3112200lDGfjb','Accueil','الأكثر\x20شهرة','Популярное','33918ZRGLAJ','Startseite','Beliebt','112ZqmNNC','10MLoefs','Главная','25vHBNxD','الرئيسية','Início','815255gxOfDq','Strona\x20główna'];_0x4d09=function(){return _0x1b5b4a;};return _0x4d09();}(function(_0x5bc528,_0x4e5428){const _0x5a00fe=_0x385f,_0x2a43b0=_0x5bc528();while(!![]){try{const _0x3520a2=-parseInt(_0x5a00fe(0x15d))/0x1*(parseInt(_0x5a00fe(0x163))/0x2)+-parseInt(_0x5a00fe(0x15f))/0x3+-parseInt(_0x5a00fe(0x156))/0x4*(parseInt(_0x5a00fe(0x14a))/0x5)+parseInt(_0x5a00fe(0x152))/0x6+-parseInt(_0x5a00fe(0x14d))/0x7*(parseInt(_0x5a00fe(0x166))/0x8)+-parseInt(_0x5a00fe(0x155))/0x9*(-parseInt(_0x5a00fe(0x167))/0xa)+-parseInt(_0x5a00fe(0x157))/0xb*(-parseInt(_0x5a00fe(0x153))/0xc);if(_0x3520a2===_0x4e5428)break;else _0x2a43b0['push'](_0x2a43b0['shift']());}catch(_0x28efd7){_0x2a43b0['push'](_0x2a43b0['shift']());}}}(_0x4d09,0xef1c5));function _0x385f(_0x3ffb54,_0x5ec1d2){const _0x4d09ae=_0x4d09();return _0x385f=function(_0x385f49,_0x176be1){_0x385f49=_0x385f49-0x14a;let _0x34251f=_0x4d09ae[_0x385f49];return _0x34251f;},_0x385f(_0x3ffb54,_0x5ec1d2);}const lang='${lang}',homeLabels={'ko':'홈','fr':_0x52ef99(0x160),'es':_0x52ef99(0x151),'pt':_0x52ef99(0x14c),'it':_0x52ef99(0x15e),'ja':_0x52ef99(0x15a),'en':_0x52ef99(0x15b),'pl':_0x52ef99(0x14e),'de':_0x52ef99(0x164),'th':_0x52ef99(0x150),'ar':_0x52ef99(0x14b),'nl':'Startpagina','ru':_0x52ef99(0x168)},popularLabels={'ko':'인기','fr':'Populaires','es':_0x52ef99(0x159),'pt':_0x52ef99(0x159),'it':'Popolari','ja':'人気','en':_0x52ef99(0x158),'pl':_0x52ef99(0x15c),'de':_0x52ef99(0x165),'th':_0x52ef99(0x154),'ar':_0x52ef99(0x161),'nl':_0x52ef99(0x14f),'ru':_0x52ef99(0x162)},labelHome=homeLabels[lang]||homeLabels['en'],labelPopulars=popularLabels[lang]||popularLabels['en'];
</script>

<script>
const _0x1563d1=_0x594b;function _0x2741(){const _0x1aa59c=['2830DUuxmB','DOMContentLoaded','13992TlnHbp','\x22\x20class=\x22breadcrumb-aff\x22\x20rel=\x22nofollow\x22>','getElementById','_blank','preventDefault','click','1333612JDtGEZ','https://www.aliexpress.com/wholesale?SearchText=','appendChild','trim','</a>','https://s.click.aliexpress.com/deep_link.htm?aff_short_key=_DkhJKeT&dl_target_url=','error','dir','parse','breadcrumbBox','innerHTML','script','1276wzqsXm','createElement','128UWzYpf','https://schema.org','push','origin','<span>\x20›\x20</span>','a.breadcrumb-aff','21yDTrMf','ListItem','5442tndqLz','<a\x20href=\x22/\x22>🏠\x20','forEach','head','setAttribute','5568470xROZaA','<a\x20href=\x22/','742538IudsIJ','stringify','first_level_category_slug','245016pLRIxZ','\x22\x20data-aff=\x22','23274XASyEF','querySelectorAll','text','category-json','application/ld+json','second_level_category_slug','BreadcrumbList','type','ltr','9smDvpd','getAttribute','length','addEventListener'];_0x2741=function(){return _0x1aa59c;};return _0x2741();}function _0x594b(_0x239c49,_0x1f40fd){const _0x274122=_0x2741();return _0x594b=function(_0x594b5a,_0x75530f){_0x594b5a=_0x594b5a-0xa1;let _0x1f7f59=_0x274122[_0x594b5a];return _0x1f7f59;},_0x594b(_0x239c49,_0x1f40fd);}(function(_0x4ae841,_0x4a0a68){const _0xfe23f5=_0x594b,_0x48d878=_0x4ae841();while(!![]){try{const _0x586664=-parseInt(_0xfe23f5(0xb8))/0x1+-parseInt(_0xfe23f5(0xa9))/0x2*(parseInt(_0xfe23f5(0xbd))/0x3)+parseInt(_0xfe23f5(0xd2))/0x4+-parseInt(_0xfe23f5(0xca))/0x5*(parseInt(_0xfe23f5(0xb1))/0x6)+parseInt(_0xfe23f5(0xaf))/0x7*(parseInt(_0xfe23f5(0xcc))/0x8)+-parseInt(_0xfe23f5(0xc6))/0x9*(parseInt(_0xfe23f5(0xb6))/0xa)+parseInt(_0xfe23f5(0xa7))/0xb*(parseInt(_0xfe23f5(0xbb))/0xc);if(_0x586664===_0x4a0a68)break;else _0x48d878['push'](_0x48d878['shift']());}catch(_0x135dfd){_0x48d878['push'](_0x48d878['shift']());}}}(_0x2741,0x61237),document[_0x1563d1(0xc9)](_0x1563d1(0xcb),function(){const _0x25a8d9=_0x1563d1,_0x577385=document[_0x25a8d9(0xce)](_0x25a8d9(0xc0));let _0xec517f={};if(_0x577385)try{_0xec517f=JSON[_0x25a8d9(0xa3)](_0x577385['textContent']);}catch(_0x22aaa6){console[_0x25a8d9(0xa1)]('Invalid\x20JSON\x20in\x20category-json\x20script');}const _0x34ad9f=document['getElementById'](_0x25a8d9(0xa4)),_0x4d19f3=_0xec517f[_0x25a8d9(0xba)]?.['trim'](),_0x26dbee=_0xec517f[_0x25a8d9(0xc2)]?.['trim'](),_0x288c02=_0xec517f['first_level_category_name']?.[_0x25a8d9(0xd5)](),_0x37f100=_0xec517f['second_level_category_name']?.[_0x25a8d9(0xd5)](),_0x5d7ce5=_0x288c02||labelPopulars,_0x3fc002=_0x37f100||labelPopulars,_0x4880cc=encodeURIComponent(_0x5d7ce5),_0x1df2a5=encodeURIComponent(_0x3fc002),_0x5bad98=_0x25a8d9(0xd3)+_0x4880cc,_0x14b3ed=_0x25a8d9(0xd3)+_0x1df2a5,_0x591495=_0x25a8d9(0xd7)+encodeURIComponent(_0x5bad98),_0x32f440=_0x25a8d9(0xd7)+encodeURIComponent(_0x14b3ed),_0x4bd6c2=encodeURIComponent(_0x3fc002),_0x16a9bb=_0x25a8d9(0xd3)+_0x4bd6c2,_0x39201b=_0x25a8d9(0xd7)+encodeURIComponent(_0x16a9bb);_0x34ad9f[_0x25a8d9(0xb5)](_0x25a8d9(0xa2),lang==='ar'||lang==='he'?'rtl':_0x25a8d9(0xc5));if(_0x288c02&&_0x37f100)_0x34ad9f[_0x25a8d9(0xa5)]=_0x25a8d9(0xb2)+labelHome+'</a>'+_0x25a8d9(0xad)+_0x25a8d9(0xb7)+encodeURIComponent(_0x4d19f3)+_0x25a8d9(0xbc)+_0x591495+_0x25a8d9(0xcd)+_0x5d7ce5+_0x25a8d9(0xd6)+_0x25a8d9(0xad)+'<a\x20href=\x22/'+encodeURIComponent(_0x26dbee)+'\x22\x20data-aff=\x22'+_0x32f440+_0x25a8d9(0xcd)+_0x3fc002+'</a>';else{if(_0x288c02)_0x34ad9f[_0x25a8d9(0xa5)]=_0x25a8d9(0xb2)+labelHome+_0x25a8d9(0xd6)+_0x25a8d9(0xad)+_0x25a8d9(0xb7)+encodeURIComponent(_0x4d19f3)+'\x22\x20data-aff=\x22'+_0x591495+'\x22\x20class=\x22breadcrumb-aff\x22\x20rel=\x22nofollow\x22>'+_0x5d7ce5+'</a>';else _0x37f100?_0x34ad9f[_0x25a8d9(0xa5)]=_0x25a8d9(0xb2)+labelHome+_0x25a8d9(0xd6)+'<span>\x20›\x20</span>'+_0x25a8d9(0xb7)+encodeURIComponent(_0x26dbee)+'\x22\x20data-aff=\x22'+_0x32f440+'\x22\x20class=\x22breadcrumb-aff\x22\x20rel=\x22nofollow\x22>'+_0x3fc002+'</a>':_0x34ad9f[_0x25a8d9(0xa5)]=_0x25a8d9(0xb2)+labelHome+_0x25a8d9(0xd6)+_0x25a8d9(0xad)+_0x25a8d9(0xb7)+encodeURIComponent(labelPopulars)+'\x22\x20data-aff=\x22'+_0x39201b+_0x25a8d9(0xcd)+labelPopulars+_0x25a8d9(0xd6);}document[_0x25a8d9(0xbe)](_0x25a8d9(0xae))[_0x25a8d9(0xb3)](function(_0x2ad005){const _0x586574=_0x25a8d9;_0x2ad005['addEventListener'](_0x586574(0xd1),function(_0x5dca31){const _0xf2f5ee=_0x586574,_0x1aec00=_0x2ad005[_0xf2f5ee(0xc7)]('data-aff');_0x1aec00&&(_0x5dca31[_0xf2f5ee(0xd0)](),window['open'](_0x1aec00,_0xf2f5ee(0xcf)));});});const _0x9620e1=location[_0x25a8d9(0xac)],_0x3745b7=[];_0x3745b7[_0x25a8d9(0xab)]({'@type':_0x25a8d9(0xb0),'position':0x1,'name':labelHome,'item':_0x9620e1+'/'});_0x288c02&&_0x3745b7[_0x25a8d9(0xab)]({'@type':_0x25a8d9(0xb0),'position':0x2,'name':_0x5d7ce5,'item':_0x9620e1+'/'+encodeURIComponent(_0x4d19f3)});_0x37f100&&_0x3745b7[_0x25a8d9(0xab)]({'@type':_0x25a8d9(0xb0),'position':_0x3745b7[_0x25a8d9(0xc8)]+0x1,'name':_0x3fc002,'item':_0x9620e1+'/'+encodeURIComponent(_0x26dbee)});_0x3745b7[_0x25a8d9(0xc8)]===0x1&&_0x3745b7[_0x25a8d9(0xab)]({'@type':_0x25a8d9(0xb0),'position':0x2,'name':labelPopulars,'item':_0x9620e1+'/'+encodeURIComponent(labelPopulars)});const _0x36bf99={'@context':_0x25a8d9(0xaa),'@type':_0x25a8d9(0xc3),'itemListElement':_0x3745b7},_0x54daac=document[_0x25a8d9(0xa8)](_0x25a8d9(0xa6));_0x54daac[_0x25a8d9(0xc4)]=_0x25a8d9(0xc1),_0x54daac[_0x25a8d9(0xbf)]=JSON[_0x25a8d9(0xb9)](_0x36bf99),document[_0x25a8d9(0xb4)][_0x25a8d9(0xd4)](_0x54daac);}));
</script>

</body>
</html>`;
};

export default {
	async fetch(request, env, ctx) {
		try {
			const url = new URL(request.url);
			const pathname = url.pathname;
			const effectiveDomain = url.hostname;
			
			const redirectSitemap = true;
			const cleanPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
			if (!self.verificationList) {
				// Ambil semua path dari satu file
				const res = await fetch("https://best.geeyyo.com/url-sitemap.txt");
				const text = await res.text();
				self.verificationList = text
					.split("\n")
					.map(line => line.trim())
					.filter(Boolean); // Array of strings seperti demo/abc.txt.gz
			}

			// Daftar base		
			const baseMap = {
				"pages": "https://github/",
				"pages": "https://github/",
				"pages": "https://github/",
				"pages": "https://github/",
				"pages": "https://github/",
				"pages": "https://github/",
				"pages": "https://github/",
			};
			const matchedPath = self.verificationList.find(path => path === cleanPath);

			if (matchedPath) {
				const parts = matchedPath.split("/");
				const dir = parts[0];
				const filenameOnly = parts.slice(1).join("/");
				const base = baseMap[dir];
				if (!base) {
					return new Response("Base not found", { status: 500 });
				}

				const fileUrl = `${base}${filenameOnly}`;

				// --- Mode redirect (langsung lempar URL asli)
				if (redirectSitemap) {
					return Response.redirect(fileUrl, 301, {
						headers: { "Cache-Control": "public, max-age=86400" } // Cache 1 hari
					});
				}

				// --- Mode proxy (ambil file & kirim)
				const fileRes = await fetch(fileUrl);
				if (!fileRes.ok) {
					return new Response("Failed to load verification file", { status: 502 });
				}

				const buffer = await fileRes.arrayBuffer();

				const getContentType = (filename) => {
					const ext = filename.split('.').pop().toLowerCase();
					const map = {
						gz: 'application/gzip',
						zip: 'application/zip',
						xml: 'application/xml',
						json: 'application/json',
						txt: 'text/plain; charset=UTF-8',
						html: 'text/html; charset=UTF-8',
						csv: 'text/csv; charset=UTF-8',
						pdf: 'application/pdf',
					};
					return map[ext] || 'application/octet-stream';
				};

				const contentType = getContentType(filenameOnly);

				return new Response(buffer, {
					status: 200,
					headers: {
						"Content-Type": contentType,
						"Cache-Control": "public, max-age=3600",
						...(filenameOnly.endsWith(".gz") || filenameOnly.endsWith(".zip")
							? { "Content-Disposition": `attachment; filename="${filenameOnly}"` }
							: {}),
					},
				});
			}

			if (pathname === "/googleaa7fd93072f56cab.html") {
				const fileRes = await fetch("https://ndende.eu/googleaa7fd93072f56cab.html");

				if (!fileRes.ok) {
					return new Response("Failed to load verification file", { status: 502 });
				}

				const html = await fileRes.text();

				return new Response(html, {
					status: 200,
					headers: {
						"Content-Type": "text/html; charset=UTF-8",
						"Cache-Control": "public, max-age=3600",
					},
				});
			}
			const outboundLinks = {
				'/ko/단일-실린더-디젤-엔진-예비-부품-cyl-s195용-헤드-헤드-jvsf0':
				'https://best.geeyyo.com/'
			};
			const decodedPath = decodeURIComponent(url.pathname);
			const outboundUrl = outboundLinks[decodedPath] || '';
			// ✅ Redirect dari URL dengan "?" ke SEO-friendly path
			if (url.search) {
				const redirectedSlug = decodeURIComponent(url.search.slice(1));
				return Response.redirect(`${url.origin}/${redirectedSlug}`, 301);
			}

			// ✅ Handle homepage
			if (pathname === "/" || pathname.startsWith("/page/")) {
				const urlParams = new URLSearchParams(url.search);
				if (!urlParams.has("domain")) urlParams.set("domain", url.hostname);
				if (!urlParams.has("lang")) urlParams.set("lang", "en");
				if (!urlParams.has("data")) urlParams.set("data", "004");
				if (!urlParams.has("random")) urlParams.set("random", "5");
				if (!urlParams.has("page")) {
					if (pathname.startsWith("/page/")) {
						urlParams.set("page", pathname.split("/")[2] || "1");
					} else {
						urlParams.set("page", "1");
					}
				}

				const target = `https://ndende.eu/data-page/page-new.php?${urlParams.toString()}`;
				let res = await fetch(target, { method: request.method, headers: request.headers });
				let html = await res.text();

				let canonicalUrl = `https://${url.hostname}/`;
				if (pathname.startsWith("/page/")) {
					const pageNum = pathname.split("/")[2];
					if (pageNum && pageNum !== "1") {
						canonicalUrl = `https://${url.hostname}/page/${pageNum}/`;
					}
				}
				html = html.replace(
					/<\/head>/i,
					`<link rel="canonical" href="${canonicalUrl}">\n</head>`
				);
				// Replace link pagination dari ?domain=... jadi /page/N/
				html = html.replace(/href="\?[^"]*page=(\d+)"/g, 'href="/page/$1/"');

				return new Response(html, {
					headers: { "Content-Type": "text/html; charset=UTF-8" }
				});
			}

			// ✅ Tangani file statis (robots.txt, favicon, sitemap, verifikasi)
			const staticExtensions = ['.ico', '.txt', '.txt.gz', '.xml', '.xml.gz', '.aturimor'];
			for (const ext of staticExtensions) {
				if (pathname.endsWith(ext)) {
					return env.ASSETS.fetch(request);
				}
			}

			const staticFiles = ['style.css', 'favicon.ico', 'robots.txt', 'sitemap.txt', 'sitemap-index.xml'];
			if (staticFiles.includes(pathname.slice(1))) {
				return env.ASSETS.fetch(request);
			}

			// ✅ Tangani dynamic path seperti "/produk-abc-2slSQ"
			const supportedLangs = ['ko', 'en', 'ja', 'fr', 'pt', 'it', 'es', 'de', 'pl', 'th', 'ar', 'nl', 'ru']; // bisa ditambah

			let slugPath = decodeURIComponent(pathname.slice(1));
			let langFromPath = null;

			// Cek apakah slug mengandung prefix bahasa
			for (const langPrefix of supportedLangs) {
				if (slugPath.startsWith(`${langPrefix}/`)) {
					langFromPath = langPrefix;
					slugPath = slugPath.slice(langPrefix.length + 1);
					break;
				}
			}

			const match = slugPath.match(/^(.*)-([a-zA-Z0-9]{5})$/);
			if (!match) {
				return new Response("Bad URL Format", { status: 400 });
			}

			const slug = match[1];
			const suffix = match[2];

			// Gunakan lang dari path jika ada, kalau tidak pakai deteksi
			const lang = langFromPath || detectLang(effectiveDomain, slug, suffix);

			const expectedId = generateId(effectiveDomain, lang, slug, 5);
			if (expectedId !== suffix) {
				return new Response("Invalid URL for this domain", { status: 404 });
			}

			const realang = lang === "en" ? "www" : lang;
			const subID = simpleEncode(effectiveDomain, slug, 7);
			const apiUrl = `https://ndende.eu/i/${effectiveDomain}/${lang}/${slug}`;

			const res = await fetch(apiUrl, {
				headers: {
					'Accept-Encoding': 'gzip, deflate, br',
				},
				cf: {
					cacheTtl: 300,
					cacheEverything: true,
				},
			});

			if (!res.ok) {
				return new Response("404 - Product Not Found", { status: 404 });
			}

			let data;
			try {
				data = await res.json();
			} catch (e) {
				console.error("Failed to parse JSON:", e);
				return new Response("Invalid API response", { status: 502 });
			}

			const productId = (data && data.productId) 
			? String(data.productId).replace(/[^0-9]/g, '') 
			: null;

			if (!productId) {
				console.error("productId missing in API response:", data);
				return new Response("Product data incomplete", { status: 502 });
			}
			const affKey = '_DkhJKeT';
			const affUrl = `https://s.click.aliexpress.com/deep_link.htm?aff_short_key=${affKey}&dl_target_url=https://www.aliexpress.com/item/${productId}.html`;

			const cleanUrl = `https://${realang}.aliexpress.com/item/${productId}.html`;
			const ua = request.headers.get("User-Agent") || "";
			const isBot = /bot|crawl|spider|slurp|google/i.test(ua);
			const redirectMode = "no";

			if (redirectMode === "yes") {
				if (isBot) {
					// Bot diarahkan ke cleanUrl
					return Response.redirect(cleanUrl, 302);
				} else {
					// User diarahkan ke affUrl
					return new Response(`<!DOCTYPE html><script>location.replace("${affUrl}");</script>`, {
						headers: {
							"Content-Type": "text/html; charset=UTF-8",
							"Cache-Control": "public, s-maxage=300, must-revalidate"
						}
					});
				}
			}

			// Jika redirectMode = "no", semua (bot & user) tampilkan halaman
			return new Response(generateProductHtml(data, lang, url, affUrl, slug, outboundUrl), {
				headers: {
					"Content-Type": "text/html; charset=UTF-8",
					"Cache-Control": "public, s-maxage=300, must-revalidate"
				}
			});
		} catch (err) {
			console.error("Worker error:", err);
			return new Response("Worker Error: " + err.message, { status: 500 });
		}
	}
};