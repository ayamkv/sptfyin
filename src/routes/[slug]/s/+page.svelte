<script>
    import { Button } from "$lib/components/ui/button";
    import { goto } from "$app/navigation";
    import { Turnstile } from 'svelte-turnstile';
    import { fly, slide } from 'svelte/transition';
    import { toast } from "svelte-sonner";
    import { getRecords, createRecord, generateRandomURL, getRecentRecords, validateToken } from '$lib/pocketbase';
    // import { generateRandomURL } from "$lib/utils";
    import * as Drawer from "$lib/components/ui/drawer/index.js";
    import * as Card from "$lib/components/ui/card";
    import { Switch } from "$lib/components/ui/switch";
    import { Input } from "$lib/components/ui/input";
    import * as Select from "$lib/components/ui/select/index.js";
    import { Label } from "$lib/components/ui/label";
    import { Separator } from "$lib/components/ui/separator";
    import * as Accordion from "$lib/components/ui/accordion";
    import 'iconify-icon';
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { strings } from "$lib/localization/languages/en.json"
    import { onMount } from "svelte";
	  import { get } from "svelte/store";
    import * as Table from "$lib/components/ui/table";

    // These variables will be undefined during SSR
    let scrollHere
    let accordionValue = 'one'
    let customShortId
    let turnstileResponse
    let isIOS, isAndroid, isMobile, isSafari, isFirefox, isOldFirefox;
    let records = []
    let rrecords
    let recordsPromise;
    let error = null;
    let recentLoading = true;
    let currentItems = 4

    function scrollToBottom() {
      scrollHere.scrollIntoView()
    }

    function setAccordionValue(newValue) {
      accordionValue = newValue;
    }


    function localizeDate(date) {
        return new Date(date).toLocaleString();
    }

    async function fetchData() {
        recentLoading = true;
        try {
          
            const response = await getRecentRecords();
            records = response.items
 
        } catch (error) {
            console.error(error);
        } finally {
            recentLoading = false;
        }
      }
      onMount(async () => {
        recordsPromise = await fetchData();
        rrecords = records;
        // console.log('from onm async: ', records);

      });
    // This function will only run in the browser
    function getBrowserName() {
       const userAgent = navigator.userAgent;

        switch (true) {
         case userAgent.includes("Chrome") && !userAgent.includes("Edg"):
            return "Chrome";
        case userAgent.includes("Firefox"):
            return "Firefox";
        case userAgent.includes("Safari") && !userAgent.includes("Chrome"):
            return "Safari";
        case userAgent.includes("Edg"):
            return "Edge";
        case userAgent.includes("Trident"):
            return "Internet Explorer";
        case userAgent.includes("OPR"):
            return "Opera";
        default:
            return "Unknown Browser";
    }
}


    onMount(() => {
        
        const ua = navigator.userAgent.toLowerCase();
        isIOS = ua.includes("iphone os") || (ua.includes("mac os") && navigator.maxTouchPoints > 0);
        isAndroid = ua.includes("android");
        isMobile = ua.includes("android") || isIOS;
        isSafari = ua.includes("safari/");
        isFirefox = ua.includes("firefox/");
        isOldFirefox = ua.includes("firefox/") && ua.split("firefox/")[1].split('.')[0] < 103;
        // console log the ua user is using
        console.log(getBrowserName());

        
    });
    // onMount(async () => {
    //   try {
    //     records = await getRecords('random_short');
    //   } catch (err) {
    //     error = `Failed to load records: ${err.response.status} ${err.response.statusText}`;
    //   }
    // });
    let reset
    let shortIdDisplay = '####';
    let inputText = null
    let isError = false;
    let alertDialogTitle = ''
    let alertDialogDescription = ''
    let errorIconDefault = 'fluent-emoji:crying-cat'
    let errorIcon = errorIconDefault
    let focus1 = false;
    let theButton
    let fullShortURL 
    let recent = []
    $: isInputTextEmpty = true
    function findUrl(str) {
        const regex = /^(https:\/\/[a-z]+\.spotify\.com\/)(playlist|artist|album|track|episode|show|user)\/.*$/mg;
        let urls = str.match(regex);
        return urls ? urls[0] : null;
    }
    if (inputText !== null) {
      isInputTextEmpty = false
    } 
    async function handlePaste(event) {
    try {
      // Request permission to access the clipboard
      const permission = await navigator.permissions.query({ name: 'clipboard-read' });

      if (permission.state === 'granted' || permission.state === 'prompt') {
        // Read from the clipboard
        const text = await navigator.clipboard.readText();
        let clipboardContent = text;

        // console.log(clipboardContent);
        // console.log(findUrl(clipboardContent));
        setTimeout(() => {
        inputText = findUrl(clipboardContent);
        isInputTextEmpty = false
        setAccordionValue('item-1');

        

        if (inputText === null) {
          setTimeout(() => {
            focus1 = false;
            // alert('No Spotify URL found in clipboard');
            isError = true;
            alertDialogTitle = strings.ErrorClipboardNoSpotifyURLTitle;
            alertDialogDescription = strings.ErrorClipboardNoSpotifyURLDesc;
            errorIcon = strings.ErrorClipboardNoSpotifyURLIcon;
            console.log(alertDialogTitle, alertDialogDescription)
          }, 1);
        }
        focus1 = true;
        
        }, 4);
      } else {
        errorIcon = errorIconDefault;
        alertDialogTitle = strings.ErrorClipboardPermTitle;
        alertDialogDescription = strings.ErrorClipboardPermissionDesc;
        isError = true;
        // alert('Clipboard access denied');
      }
    } catch (e) {
      let error = String(e).toLowerCase();

      if (error.includes("denied")) isError = true;
      console.error('Failed to read clipboard: ', error);
      if (error.includes("function") && isFirefox) alert('Firefox does not support clipboard access');
      if (error.includes("dismissed") || isIOS) alert('Sorry! iOS Safari does not support clipboard access 😔');
    }
  }

  
  
    // onMount(() => {
    //     console.log(strings)
    // });

    // onMount(() => {
    //   escapeSelectHandle();
    // })
 
    async function handleCopy(event) {
    try {
      // Request permission to access the clipboard
      const permission = await navigator.permissions.query({ name: 'clipboard-write' });

      if (permission.state === 'granted' || permission.state === 'prompt') {
        // Write to the clipboard
        await navigator.clipboard.writeText(fullShortURL);
        toast.success("Success 🥳", {
          description: "The link has been copied to your clipboard!",
          action: {
            label: "Okay",
            onClick: () => console.info("Copy")
          }
        });
      } else {
        alert('Clipboard access denied');
      }
    } catch (e) {
      let error = String(e).toLowerCase();

      if (error.includes("denied")) alert('Clipboard access denied');
      console.error('Failed to write to clipboard: ', error);
    }
  }
    



    // console.log(generateRandomURL());
    // $: console.log(selected.value)
    // $: console.log(turnstileResponse)


    // $: console.log('isInput: ' + isInputTextEmpty)

</script>




<AlertDialog.Root bind:open={isError} class="transition-all">
  <AlertDialog.Trigger></AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <iconify-icon icon={errorIcon} class="block m-auto text-center" width=120></iconify-icon>
      <AlertDialog.Title class="text-center">Ouch! {@html alertDialogTitle}</AlertDialog.Title>
      
      <AlertDialog.Description>
          {@html alertDialogDescription}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Action class="min-w-full font-semibold" on:click={() => isError = false}>okay, got it</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<div class="flex flex-col items-center justify-center">
  <h1 class="text-8xl font-bold text-primary font-jak-display ss03 md:flex-none hidden md:block translate-y-[12rem]">Sptfy.in</h1>
</div>

<div class="flex flex-col items-center justify-center min-h-screen gap-6 p-10 -translate-y-8 md:flex-row md:items-start md:translate-y-[12.5rem]">
  <h1 class="text-6xl font-bold text-primary font-jak-display ss03 md:flex-none md:hidden">Sptfy.in</h1>
      <Card.Root class="w-[23rem] md:w-[35rem] sm:w-[25rem]  transition-all">
        <Card.Header>
          <Card.Title>Link analytics</Card.Title>
          <Card.Description>Here's how your URL will look like</Card.Description>
          <Card.Content class="grid gap-4 text-[#82d1af]/60 text-left px-0 pb-0">
            <div class="flex w-full min-w-full items-center align-center justify-between md:py-2 ">
              <p class="text-[1.44rem] md:text-3xl lg:text-5xl font-semibold break-all">sptfy.in/<span class="text-[#82d1af]">{shortIdDisplay}</span></p>
            
               <div class="buttons flex md:flex-col-reverse">
                <Button on:click={() => {
                  handleCopy();
                }} variant="secondary" class="hover:bg-primary hover:text-black p-3" >
                    <iconify-icon icon="lucide:copy" class="" width="24">
                  </iconify-icon>
                </Button>
                <Button on:click={() => {
                  //redirect to link;
                  //using window location and just /{urlId} open in new tab

                  window.open(`/${shortIdDisplay}`, '_blank');
                }} variant="secondary" class="hover:bg-primary hover:text-black p-3" >
                    <iconify-icon icon="lucide:square-arrow-out-up-right" class="" width="24">
                  </iconify-icon>
                </Button>
               </div>
             

            </div>
<!-- IF SHORT URL EXITST-->
<Drawer.Root>
  <Drawer.Trigger>
    <Button variant="secondary" class="w-full">Show QR Code</Button>
  </Drawer.Trigger>
  <Drawer.Content>
    <Drawer.Header>
      <Drawer.Title class="text-center">QR Code</Drawer.Title>
      <Drawer.Description>
        <div class="flex flex-col text-center items-center align-center">
          <p class="mb-4">
            Scan this QR code to open the link on your phone
          </p>
          <img class="min-w-[50%] md:min-w-[20%]" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=https://sptfy.in/{shortIdDisplay}" alt="QR Code" on:load={console.log('IMG LOADED')} />

        </div>
        <!-- <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://sptfy.in/{shortIdDisplay}" alt="QR Code" /> -->
        
      </Drawer.Description>
    </Drawer.Header>
    <Drawer.Footer>
      <Drawer.Close>Close</Drawer.Close>
    </Drawer.Footer>
  </Drawer.Content>
</Drawer.Root>

<div class="gap-1" >
  <Table.Root>
    <Table.Caption>A list of your recent invoices.</Table.Caption>
    <Table.Header>
      <Table.Row>
        <Table.Head>Countries</Table.Head>
        <Table.Head class="w-[100px]">Browser</Table.Head>
        <Table.Head>OS</Table.Head>
        <Table.Head>Referers</Table.Head>

      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell class="font-medium">Indonesia</Table.Cell>
        <Table.Cell>Chrome</Table.Cell>
        <Table.Cell>Windows</Table.Cell>
      
      </Table.Row>
    </Table.Body>
  </Table.Root>
</div>

      </Card.Content>
    </Card.Header>
  </Card.Root>
       
          
</div>
<div class="scrollhere" bind:this={scrollHere}></div>

<!-- <div class="flex text-left ">
  <p>coming soon features : <br>
    <li>qr code</li> 
    <li>analytics</li>
    <li>custom subdomain & back url</li> 

    <p>the website is half baked so be patient my g</p>
 
</div> -->
